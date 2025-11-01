import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
  const mapRef = useRef<MapView>(null);

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
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
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
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation?.latitude || 20.5937,
              longitude: currentLocation?.longitude || 78.9629,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            followsUserLocation={false}
            toolbarEnabled={false}
            provider={null}
            mapType="none"
          >
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            {/* Route Path */}
            {routePath.length > 1 && (
              <Polyline
                coordinates={routePath.map(loc => ({
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }))}
                strokeColor="#5B21B6"
                strokeWidth={4}
              />
            )}

            {/* Current Location Marker */}
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title={`${userName}'s Location`}
              description="Current location"
            >
              <View style={styles.markerContainer}>
                <MaterialIcons name="person-pin-circle" size={40} color="#E53E3E" />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading location...</Text>
          </View>
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
