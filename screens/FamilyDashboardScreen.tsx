import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapLibreGL, { CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
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

type FamilyDashboardScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { requestId: string; userName: string } }, 'params'>;
};

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const FamilyDashboardScreen: React.FC<FamilyDashboardScreenProps> = ({ navigation, route }) => {
  const { requestId, userName } = route.params;
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [routePath, setRoutePath] = useState<LocationData[]>([]);
  const cameraRef = useRef<CameraRef | null>(null);
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
    // Listen to real-time location updates from Firestore
    const walkRef = doc(db, 'walkRequests', requestId);
    
    const unsubscribe = onSnapshot(walkRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        if (data.currentLocation) {
          const newLocation: LocationData = {
            latitude: data.currentLocation.latitude,
            longitude: data.currentLocation.longitude,
            timestamp: Date.now(),
          };
          
          setCurrentLocation(newLocation);
          
          // Add to route path
          setRoutePath((prev) => [...prev, newLocation]);
          
          // Center map on new location
          cameraRef.current?.setCamera({
            centerCoordinate: toPosition(newLocation),
            zoomLevel: 15,
            animationDuration: 1000,
          });
        }

        // Check if walk has ended
        if (data.status === 'completed') {
          Alert.alert(
            'Walk Completed',
            `${userName}'s walk has been completed.`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      }
    }, (error) => {
      console.error('Error listening to location updates:', error);
      Alert.alert('Error', 'Failed to track location. Please try again.');
    });

    return () => unsubscribe();
  }, [requestId, userName, navigation]);

  const handleBackPress = () => {
    navigation.goBack();
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
              {routeShape && (
                <MapLibreGL.ShapeSource id="family-route" shape={routeShape}>
                  <MapLibreGL.LineLayer id="family-route-line" style={routeLineStyle} />
                </MapLibreGL.ShapeSource>
              )}
              <MapLibreGL.PointAnnotation
                id="family-current-location"
                coordinate={toPosition(currentLocation)}
                title={`${userName}'s Location`}
              >
                <View style={styles.currentLocationMarker}>
                  <MaterialIcons name="person-pin-circle" size={32} color="#FFFFFF" />
                </View>
              </MapLibreGL.PointAnnotation>
            </MapLibreGL.MapView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading location...</Text>
            </View>
          )
        ) : (
          <MapFallback message="Map preview is unavailable in Expo Go. Install the MoveMates dev build or production app to track walks." />
        )}
      </View>

      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pimple Nilakh</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingTitle}>
            Live tracking of {userName}'s location...
          </Text>
          <Text style={styles.trackingSubtitle}>
            This is live tracking of {userName}'s walk.{'\n'}
            You may keep a track of your people for{'\n'}
            their safety along with us :)
          </Text>
        </View>
      </View>
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
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E53E3E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    marginBottom: 10,
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  trackingSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#E0E0E0',
    lineHeight: 22,
  },
});

export default FamilyDashboardScreen;
