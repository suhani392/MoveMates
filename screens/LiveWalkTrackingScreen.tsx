import React, { useState, useEffect, useRef } from 'react';
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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    startLocationTracking();

    return () => {
      // Cleanup location tracking on unmount
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Listen for walk completion (for wanderers)
  useEffect(() => {
    if (!isWandererView) return; // Only for wanderers

    const walkRef = doc(db, 'walkRequests', requestId);
    const unsubscribe = onSnapshot(walkRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // When walk is completed, navigate to payment screen
        if (data.status === 'completed') {
          const distance = data.totalDistance || 0;
          const duration = data.totalDuration || 0;
          const walkerRate = 100; // TODO: Get from walker profile
          
          navigation.replace('Payment', {
            requestId,
            distance,
            duration,
            walkerRate,
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
          if (currentLocation) {
            const distance = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              newCoords.latitude,
              newCoords.longitude
            );
            setTotalDistance((prev) => prev + distance);
          }

          setCurrentLocation(newCoords);
          setRoutePath((prevPath) => [...prevPath, newCoords]);

          // Update Firestore with current location for real-time tracking
          const requestRef = doc(db, 'walkRequests', requestId);
          updateDoc(requestRef, {
            currentLocation: {
              latitude: newCoords.latitude,
              longitude: newCoords.longitude,
            },
            lastUpdated: new Date(),
          }).catch(err => console.error('Error updating location:', err));

          // Center map on current location
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...newCoords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
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
    Alert.alert(
      'End Walk',
      'Are you sure you want to end this walk?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Walk',
          style: 'destructive',
          onPress: async () => {
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

              // Navigate to Payment screen with walk data
              navigation.replace('Payment', {
                requestId,
                distance: totalDistance,
                duration: durationInMinutes,
                walkerRate: 100, // TODO: Get from walker profile
                walkerName: wandererName,
                isWandererView: false,
              });
            } catch (error) {
              console.error('Error ending walk:', error);
              Alert.alert('Error', 'Failed to end the walk. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEmergencySOS = () => {
    navigation.navigate('SOS', { requestId });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
            followsUserLocation
          >
            {/* Current location marker */}
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              pinColor="#EF4444"
            />

            {/* Route path */}
            {routePath.length > 1 && (
              <Polyline
                coordinates={routePath}
                strokeColor="#5B21B6"
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pimple Nilakh</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Notifications')}>
          <MaterialIcons name="notifications" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingTitle}>Live tracking your location...</Text>
          <Text style={styles.trackingSubtitle}>
            This is live tracking of your walk.{'\n'}
            You may end the walk once you are{'\n'}
            done with your daily target :)
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
    paddingHorizontal: 15,
    paddingTop: 50,
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
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  map: {
    width: '100%',
    height: '100%',
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
});

export default LiveWalkTrackingScreen;
