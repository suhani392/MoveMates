import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { authService } from '../services/authService';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

type WandererHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface LocationSuggestion {
  description: string;
  placeId?: string;
}

const WandererHomeScreen: React.FC<WandererHomeScreenProps> = ({ navigation }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [locationPermission, setLocationPermission] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const mapRef = useRef<MapView>(null);
  const { userData } = useAuth();

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use the map.');
        return;
      }
      setLocationPermission(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(coords);

      // Get address from coordinates
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setCurrentAddress(address);

      // Store location in Firestore
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          location: coords,
          lastLocationUpdate: new Date(),
        }).catch(() => {});
      }
    })();
  }, []);

  // Set user as online when component mounts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    updateDoc(doc(db, 'users', user.uid), {
      isOnline: true,
    }).catch(() => {});

    // Set offline when component unmounts
    return () => {
      updateDoc(doc(db, 'users', user.uid), {
        isOnline: false,
      }).catch(() => {});
    };
  }, []);

  // Update location in real-time every 10 seconds
  useEffect(() => {
    if (!locationPermission) return;

    const locationInterval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coords);

        // Update Firestore
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            location: coords,
            lastLocationUpdate: new Date(),
          }).catch(() => {});
        }
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(locationInterval);
  }, [locationPermission]);

  // Listen for unread notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const unreadQuery = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setHasUnreadNotifications(!snapshot.empty);
    });

    return () => unsubscribe();
  }, []);

  // Load recent locations from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecentLocations(data?.recentLocations || []);
      }
    });

    return () => unsubscribe();
  }, []);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const result = results[0];
        return `${result.street || ''}, ${result.city || ''}, ${result.region || ''}`;
      }
      return 'Current Location';
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return 'Current Location';
    }
  };

  // Fetch location suggestions from Google Places API
  const fetchLocationSuggestions = async (input: string, isPickup: boolean) => {
    if (input.length < 3) {
      if (isPickup) {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
      return;
    }

    try {
      const apiKey = 'AIzaSyAAn7WMlGaRR7Si4cf5SCZE91kNOUuxBrQ';
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:in`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions) {
        const suggestions = data.predictions.map((prediction: any) => ({
          description: prediction.description,
          placeId: prediction.place_id,
        }));

        if (isPickup) {
          setPickupSuggestions(suggestions);
          setShowPickupSuggestions(true);
        } else {
          setDestinationSuggestions(suggestions);
          setShowDestinationSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Handle pickup input change
  const handlePickupChange = (text: string) => {
    setPickup(text);
    fetchLocationSuggestions(text, true);
  };

  // Handle destination input change
  const handleDestinationChange = (text: string) => {
    setDestination(text);
    fetchLocationSuggestions(text, false);
  };

  // Select suggestion
  const selectSuggestion = async (suggestion: string, isPickup: boolean) => {
    if (isPickup) {
      setPickup(suggestion);
      setShowPickupSuggestions(false);
    } else {
      setDestination(suggestion);
      setShowDestinationSuggestions(false);
    }

    // Save to recent locations
    const user = auth.currentUser;
    if (user) {
      const updatedRecent = [suggestion, ...recentLocations.filter(loc => loc !== suggestion)].slice(0, 5);
      await updateDoc(doc(db, 'users', user.uid), {
        recentLocations: updatedRecent,
      }).catch(() => {});
    }
  };

  // Use current location for pickup
  const useCurrentLocationForPickup = () => {
    if (currentAddress) {
      setPickup(currentAddress);
      setShowPickupSuggestions(false);
    }
  };

  // No manual fetch required; we rely on real-time context

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const openDrawer = () => {
    setMenuVisible(true);
  };

  const closeDrawer = () => {
    setMenuVisible(false);
  };

  const handleBookSlot = () => {
    // Validate pickup and destination
    if (!pickup.trim()) {
      Alert.alert('Missing Information', 'Please enter a pickup location.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Missing Information', 'Please enter a destination.');
      return;
    }
    
    // Navigate to schedule screen with location data
    navigation.navigate('ScheduleDateTime', {
      pickup: pickup.trim(),
      destination: destination.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      {currentLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={true}
        >
          {/* Current Location Marker */}
          <Marker
            coordinate={currentLocation}
            title="You are here"
            description="Your current location"
          />
        </MapView>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialIcons name="notifications" size={28} color="#FFFFFF" />
          {hasUnreadNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      {/* Walking Person Icon Circle */}
      <TouchableOpacity 
        style={styles.walkingIconCircle}
        onPress={() => navigation.navigate('WalkerUpdates')}
        activeOpacity={0.8}
      >
        <Image source={require('../assets/walk.png')} style={{ width: 20, height: 20, tintColor: '#FFFFFF' }} />
      </TouchableOpacity>

      {/* Bottom Card */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.bottomCard}>
          {/* Pickup */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Pickup</Text>
              {currentAddress && (
                <TouchableOpacity 
                  style={styles.currentLocationButton}
                  onPress={useCurrentLocationForPickup}
                >
                  <MaterialIcons name="my-location" size={14} color="#000" />
                  <Text style={styles.currentLocationText}>Use Current</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="my-location" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={pickup}
                onChangeText={handlePickupChange}
                placeholder="Enter pickup location"
                placeholderTextColor="#999"
                onFocus={() => {
                  if (recentLocations.length > 0 && !pickup) {
                    setShowPickupSuggestions(true);
                  }
                }}
              />
            </View>
            
            {/* Pickup Suggestions */}
            {showPickupSuggestions && (
              <View style={styles.suggestionsContainer}>
                {recentLocations.length > 0 && !pickup && (
                  <>
                    <Text style={styles.suggestionHeader}>Recent Locations</Text>
                    {recentLocations.map((location, index) => (
                      <TouchableOpacity
                        key={`recent-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => selectSuggestion(location, true)}
                      >
                        <MaterialIcons name="history" size={18} color="#666" />
                        <Text style={styles.suggestionText}>{location}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {pickupSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion.description, true)}
                  >
                    <MaterialIcons name="place" size={18} color="#666" />
                    <Text style={styles.suggestionText}>{suggestion.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Destination */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Destination</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="place" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={handleDestinationChange}
                placeholder="Enter destination"
                placeholderTextColor="#999"
                onFocus={() => {
                  if (recentLocations.length > 0 && !destination) {
                    setShowDestinationSuggestions(true);
                  }
                }}
              />
            </View>
            
            {/* Destination Suggestions */}
            {showDestinationSuggestions && (
              <View style={styles.suggestionsContainer}>
                {recentLocations.length > 0 && !destination && (
                  <>
                    <Text style={styles.suggestionHeader}>Recent Locations</Text>
                    {recentLocations.map((location, index) => (
                      <TouchableOpacity
                        key={`recent-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => selectSuggestion(location, false)}
                      >
                        <MaterialIcons name="history" size={18} color="#666" />
                        <Text style={styles.suggestionText}>{location}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {destinationSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion.description, false)}
                  >
                    <MaterialIcons name="place" size={18} color="#666" />
                    <Text style={styles.suggestionText}>{suggestion.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookSlot}
          >
            <Text style={styles.bookButtonText}>Book a Slot</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Drawer */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={closeDrawer}
      >
        <View style={styles.overlay}>
          <View style={styles.drawer}>
            {/* Profile Header */}
            <TouchableOpacity 
              style={styles.profileHeader} 
              onPress={() => {
                closeDrawer();
                navigation.navigate('Profile');
              }}
            >
              <View style={styles.profileCircle}>
                {userData?.profileImage || userData?.image ? (
                  <Image
                    source={{ uri: (userData.profileImage || userData.image) }}
                    style={{ width: 70, height: 70, borderRadius: 35 }}
                  />
                ) : (
                  <MaterialIcons name="person" size={40} color="#666" />
                )}
              </View>
              <Text style={styles.userName}>{userData?.name || 'User Name'}</Text>
            </TouchableOpacity>

            {/* Menu Items */}
            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
              }}
            >
              <Text style={styles.drawerText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('Notifications');
              }}
            >
              <Text style={styles.drawerText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('ContactUs');
              }}
            >
              <Text style={styles.drawerText}>Contact Us</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('HelpPolicy');
              }}
            >
              <Text style={styles.drawerText}>Help & Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.drawerText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('About');
              }}
            >
              <Text style={styles.drawerText}>About</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity 
              style={[styles.drawerItem, styles.logoutItem]} 
              onPress={() => { 
                closeDrawer();
                handleSignOut();
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  walkingIconCircle: {
    position: 'absolute',
    top: 110,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: Platform.OS === 'ios' ? 25 : 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  bookButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  currentLocationText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },

  // Drawer
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  drawer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  profileCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  drawerItem: {
    marginBottom: 35,
  },
  drawerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutItem: {
    position: 'absolute',
    bottom: 50,
    left: 30,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '600',
  },
});

export default WandererHomeScreen;
