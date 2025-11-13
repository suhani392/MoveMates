import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
  TextInput,
  Clipboard,
} from 'react-native';
import MapLibreGL, { CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_STYLE_URL,
  buildLineStringFeatureCollection,
  isMapLibreSupported,
  toPosition,
  type LatLng,
} from '../utils/mapLibre';
import MapFallback from '../components/MapFallback';

type LiveWalkTrackingScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { requestId: string; wandererName: string; wandererPhone?: string; isWandererView?: boolean } }, 'params'>;
};

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const LiveWalkTrackingScreen: React.FC<LiveWalkTrackingScreenProps> = ({ navigation, route }) => {
  const { requestId, wandererName, wandererPhone, isWandererView = false } = route.params;
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [routePath, setRoutePath] = useState<LocationCoords[]>([]);
  const [isTracking, setIsTracking] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [totalDistance, setTotalDistance] = useState(0); // in meters
  const [startTime] = useState(Date.now());
  const [liveDistance, setLiveDistance] = useState(0); // Distance synced from Firestore
  const [showEndWalkModal, setShowEndWalkModal] = useState(false);
  const cameraRef = useRef<CameraRef | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const defaultCameraCenter: LatLng = currentLocation ?? MAP_DEFAULT_CENTER;
  const routeShape = useMemo(
    () =>
      buildLineStringFeatureCollection(
        routePath.map(({ latitude, longitude }) => ({ latitude, longitude }))
      ),
    [routePath]
  );
  const routeLineStyle = useMemo(
    () => ({
      lineColor: '#5B21B6',
      lineWidth: 4,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }),
    []
  );

  useEffect(() => {
    startLocationTracking();

    return () => {
      // Cleanup location tracking on unmount
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Listen for walk updates (distance and completion)
  useEffect(() => {
    const walkRef = doc(db, 'walkRequests', requestId);
    const unsubscribe = onSnapshot(walkRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // Update live distance for both users
        if (data.liveDistance !== undefined) {
          setLiveDistance(data.liveDistance);
        }
        
        // When walk is completed, navigate to payment screen (for wanderers)
        if (isWandererView && data.status === 'completed') {
          const distance = data.totalDistance || 0;
          const duration = data.totalDuration || 0;
          const walkerRate = 100; // TODO: Get from walker profile
          const walkerId = data.walkerId || '';
          
          navigation.replace('Payment', {
            requestId,
            distance,
            duration,
            walkerId,
            walkerName: wandererName,
            isWandererView: true,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [isWandererView, requestId, navigation, wandererName]);

  const startLocationTracking = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track your walk.');
        return;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const initialCoords = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      };

      setCurrentLocation(initialCoords);
      setRoutePath([initialCoords]);

      // Start watching location
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          // Calculate distance from previous location
          let newDistance = 0;
          if (currentLocation) {
            const distance = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              newCoords.latitude,
              newCoords.longitude
            );
            newDistance = totalDistance + distance;
            setTotalDistance(newDistance);
          }

          setCurrentLocation(newCoords);
          setRoutePath((prevPath) => [...prevPath, newCoords]);

          // Update Firestore with current location and distance for real-time tracking
          const requestRef = doc(db, 'walkRequests', requestId);
          updateDoc(requestRef, {
            currentLocation: {
              latitude: newCoords.latitude,
              longitude: newCoords.longitude,
            },
            liveDistance: newDistance,
            lastUpdated: new Date(),
          }).catch(err => console.error('Error updating location:', err));

          // Center map on current location
          cameraRef.current?.setCamera({
            centerCoordinate: toPosition(newCoords),
            zoomLevel: 15,
            animationDuration: 1000,
          });
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleShareWalk = () => {
    if (!currentLocation) {
      Alert.alert('Location Unavailable', 'Current location is not available yet.');
      return;
    }

    // Generate deep link for Family Dashboard
    const deepLink = `movemates://familydashboard?requestId=${requestId}&userName=${encodeURIComponent(wandererName)}`;
    setShareLink(deepLink);
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    Clipboard.setString(shareLink);
    // Link copied silently without popup
  };

  const handleSendViaSMS = async () => {
    const message = `I'm currently on a walk! Track my live location in real-time:\n\n${shareLink}\n\nOpen this link in the MoveMates app to see my live location.`;
    
    try {
      const smsUrl = Platform.OS === 'ios' 
        ? `sms:&body=${encodeURIComponent(message)}`
        : `sms:?body=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        setShowShareModal(false);
      } else {
        Alert.alert('Error', 'Unable to open SMS app.');
      }
    } catch (error) {
      console.error('Error sharing via SMS:', error);
      Alert.alert('Error', 'Failed to share via SMS.');
    }
  };

  const handleEndWalk = () => {
    setShowEndWalkModal(true);
  };

  const confirmEndWalk = async () => {
    setShowEndWalkModal(false);
    try {
      // Stop location tracking
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      // Calculate duration in minutes
      const durationInMinutes = Math.round((Date.now() - startTime) / 60000);

      // Update walk status in Firestore
      const requestRef = doc(db, 'walkRequests', requestId);
      await updateDoc(requestRef, {
        status: 'completed',
        completedAt: new Date(),
        totalDistance: totalDistance,
        totalDuration: durationInMinutes,
      });

      // Get walkRequest data to extract walkerId
      const walkRef = doc(db, 'walkRequests', requestId);
      const walkSnap = await getDoc(walkRef);
      const walkData = walkSnap.data();
      const walkerId = walkData?.walkerId || '';

      // Navigate to Payment screen with walk data
      navigation.replace('Payment', {
        requestId,
        distance: totalDistance,
        duration: durationInMinutes,
        walkerId,
        walkerName: wandererName,
        isWandererView: false,
      });
    } catch (error) {
      console.error('Error ending walk:', error);
      Alert.alert('Error', 'Failed to end the walk. Please try again.');
    }
  };

  const handleEmergencySOS = () => {
    navigation.navigate('SOS', { requestId });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const recenterToUser = () => {
    if (!currentLocation || !cameraRef.current) {
      Alert.alert('Location Unavailable', 'Current location is not available yet.');
      return;
    }
    cameraRef.current.setCamera({
      centerCoordinate: toPosition(currentLocation),
      zoomLevel: 15,
      animationDuration: 500,
    });
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {isMapLibreSupported ? (
          currentLocation ? (
            <MapLibreGL.MapView
              style={styles.map}
              mapStyle={MAP_STYLE_URL}
              compassEnabled={false}
              attributionEnabled={false}
              logoEnabled={false}
            >
              <MapLibreGL.Camera
                ref={cameraRef}
                defaultSettings={{
                  centerCoordinate: toPosition(defaultCameraCenter),
                  zoomLevel: MAP_DEFAULT_ZOOM,
                }}
              />
              <MapLibreGL.UserLocation visible />
              {routeShape && (
                <MapLibreGL.ShapeSource id="live-walk-route" shape={routeShape}>
                  <MapLibreGL.LineLayer id="live-walk-route-line" style={routeLineStyle} />
                </MapLibreGL.ShapeSource>
              )}
              <MapLibreGL.PointAnnotation
                id="live-current-location"
                coordinate={toPosition(currentLocation)}
                title="Your Location"
              >
                <View style={styles.currentLocationMarker}>
                  <MaterialIcons name="directions-walk" size={24} color="#FFFFFF" />
                </View>
              </MapLibreGL.PointAnnotation>
            </MapLibreGL.MapView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )
        ) : (
          <MapFallback message="Live tracking requires the MoveMates development build or production app." />
        )}
      </View>

      {/* Locate Me FAB */}
      <TouchableOpacity
        style={styles.locateFab}
        onPress={recenterToUser}
        activeOpacity={0.8}
      >
        <MaterialIcons name="my-location" size={22} color="#000" />
      </TouchableOpacity>

      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{flex:1}} />
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Notifications')}>
          <MaterialIcons name="notifications" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Distance Display - Top */}
      <View style={styles.distanceCardTop}>
        <MaterialIcons name="directions-walk" size={24} color="#5B21B6" />
        <View style={styles.distanceInfoTop}>
          <Text style={styles.distanceLabelTop}>Distance Walked</Text>
          <Text style={styles.distanceValueTop}>
            {(liveDistance / 1000).toFixed(2)} km
          </Text>
        </View>
        <View style={styles.distanceInfoTop}>
          <Text style={styles.distanceLabelTop}>Meters</Text>
          <Text style={styles.distanceValueSmallTop}>
            {Math.round(liveDistance)} m
          </Text>
        </View>
      </View>

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingTitle}>Live tracking your location...</Text>
          <Text style={styles.trackingSubtitle}>
            This is live tracking of your walk.{'\n'}
            You may end the walk once you are{'\n'}
            done with your target :)
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Share Walk - Available for both walker and wanderer */}
          <TouchableOpacity
            style={isWandererView ? styles.shareButtonFull : styles.shareButton}
            onPress={handleShareWalk}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>Share Walk</Text>
          </TouchableOpacity>

          {/* End Walk - Only for walker */}
          {!isWandererView && (
            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndWalk}
              activeOpacity={0.8}
            >
              <Text style={styles.endButtonText}>End Walk</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Emergency SOS */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleEmergencySOS}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>
            Feeling unsafe? Notify your contacts{'\n'}
            via an <Text style={styles.sosHighlight}>Emergency SOS</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share Walk Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Walk</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <MaterialIcons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Share this link with your family and friends to let them track your walk in real-time.
            </Text>

            {/* Link Input with Copy Button */}
            <View style={styles.linkContainer}>
              <TextInput
                style={styles.linkInput}
                value={shareLink}
                editable={false}
                multiline
                numberOfLines={2}
              />
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopyLink}
                activeOpacity={0.7}
              >
                <MaterialIcons name="content-copy" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.smsButton}
              onPress={handleSendViaSMS}
              activeOpacity={0.8}
            >
              <MaterialIcons name="message" size={20} color="#FFFFFF" />
              <Text style={styles.smsButtonText}>Send via SMS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Walk Confirmation Modal */}
      <Modal
        visible={showEndWalkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndWalkModal(false)}
      >
        <View style={styles.endWalkModalOverlay}>
          <View style={styles.endWalkModalContent}>
            <View style={styles.endWalkIconContainer}>
              <MaterialIcons name="flag" size={48} color="#EF4444" />
            </View>
            
            <Text style={styles.endWalkModalTitle}>End Walk?</Text>
            <Text style={styles.endWalkModalMessage}>
              Are you sure you want to end this walk? This will complete the walk and proceed to payment.
            </Text>

            <View style={styles.endWalkModalButtons}>
              <TouchableOpacity
                style={styles.endWalkCancelButton}
                onPress={() => setShowEndWalkModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.endWalkCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.endWalkConfirmButton}
                onPress={confirmEndWalk}
                activeOpacity={0.8}
              >
                <Text style={styles.endWalkConfirmButtonText}>End Walk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  distanceCardTop: {
    position: 'absolute',
    top: 105,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  distanceInfoTop: {
    flex: 1,
  },
  distanceLabelTop: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  distanceValueTop: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B21B6',
  },
  distanceValueSmallTop: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B21B6',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  currentLocationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 30,
    zIndex: 10,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    gap: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  distanceInfo: {
    flex: 1,
  },
  distanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5B21B6',
  },
  distanceValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B21B6',
  },
  trackingInfo: {
    marginBottom: 20,
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  trackingSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonFull: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  endButton: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sosButton: {
    backgroundColor: '#000000',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sosText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  sosHighlight: {
    color: '#EF4444',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  modalDescription: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 22,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
  },
  linkInput: {
    flex: 1,
    padding: 12,
    fontSize: 13,
    color: '#333333',
    maxHeight: 60,
  },
  copyButton: {
    backgroundColor: '#5B21B6',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginVertical: 4,
    borderRadius: 8,
    minWidth: 44,
  },
  smsButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  smsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locateFab: {
    position: 'absolute',
    top: 190,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  endWalkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endWalkModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  endWalkIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  endWalkModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  endWalkModalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  endWalkModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  endWalkCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  endWalkCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  endWalkConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  endWalkConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LiveWalkTrackingScreen;
