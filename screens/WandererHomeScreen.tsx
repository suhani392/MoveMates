import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import '../utils/mapboxConfig'; // Initialize Mapbox
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

type WandererHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface LocationSuggestion {
  description: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}

const WandererHomeScreen: React.FC<WandererHomeScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { showToast } = useToast();

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
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const mapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [pickupCoord, setPickupCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const enableRoutingStep = true;
  const pickupDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const destDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  // When both coordinates are available, auto-fetch route (step is enabled)
  useEffect(() => {
    if (enableRoutingStep && pickupCoord && destinationCoord) {
      fetchRoute(pickupCoord, destinationCoord);
    } else {
      setRouteCoords([]);
      setRouteDistance(null);
      setRouteDuration(null);
    }
  }, [enableRoutingStep, pickupCoord, destinationCoord]);

  // Define reverseGeocode function before useEffect (moved up to fix crash)
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MoveMates/1.0 (contact@movemates.app)' },
      });
      const data = await res.json();
      return data?.display_name || 'Current Location';
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return 'Current Location';
    }
  };

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      try {
        // Set default location first to prevent MapView crash
        const defaultLocation = { latitude: 20.5937, longitude: 78.9629 };
        setCurrentLocation(defaultLocation);
        setIsLocationReady(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use the map. Using default location.');
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

        // Center map on user's location
        if (cameraRef.current) {
          try {
            cameraRef.current.flyTo([coords.longitude, coords.latitude], 1000);
          } catch (mapError) {
            console.error('Map animation error:', mapError);
          }
        }

        // Get address from coordinates
        try {
          const address = await reverseGeocode(coords.latitude, coords.longitude);
          setCurrentAddress(address);
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          setCurrentAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        }

        // Store location in Firestore
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            location: coords,
            lastLocationUpdate: new Date(),
          }).catch(() => {});
        }
      } catch (error) {
        console.error('Location error:', error);
        // Ensure we have a location even if there's an error
        if (!currentLocation) {
          setCurrentLocation({ latitude: 20.5937, longitude: 78.9629 });
          setIsLocationReady(true);
        }
      }
    })();
  }, []);

  // Recenter map to user location and optionally set pickup
  const recenterToUser = () => {
    if (!currentLocation || !cameraRef.current) {
      Alert.alert('Location Unavailable', 'Enable location services to use this feature.');
      return;
    }
    cameraRef.current.flyTo([currentLocation.longitude, currentLocation.latitude], 500);
    if (!pickupCoord) {
      setPickupCoord(currentLocation);
      if (destinationCoord && enableRoutingStep) {
        fetchRoute(currentLocation, destinationCoord);
      }
    }
  };

  // Free-stack helpers (component scope)
  const geocodeText = async (text: string): Promise<{ latitude: number; longitude: number }> => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MoveMates/1.0 (contact@movemates.app)' },
    });
    const data = await res.json();
    const item = Array.isArray(data) && data[0];
    const lat = item ? parseFloat(item.lat) : NaN;
    const lon = item ? parseFloat(item.lon) : NaN;
    if (!isNaN(lat) && !isNaN(lon)) {
      return { latitude: lat, longitude: lon };
    }
    throw new Error('no geocode');
  };

  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    let index = 0, lat = 0, lng = 0;
    const coordinates: Array<{ latitude: number; longitude: number }> = [];
    while (index < encoded.length) {
      let b = 0, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;
      coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coordinates;
  };

  const fitMapToPoints = (
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
    path: Array<{ latitude: number; longitude: number }> = []
  ) => {
    const points = path.length > 1 ? path : [a, b];
    if (cameraRef.current && points.length) {
      const coordinates = points.map(p => [p.longitude, p.latitude] as [number, number]);
      // Calculate bounds
      const lons = coordinates.map(c => c[0]);
      const lats = coordinates.map(c => c[1]);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      // Use Camera to fit bounds
      const centerLon = (minLon + maxLon) / 2;
      const centerLat = (minLat + maxLat) / 2;
      const lonDelta = maxLon - minLon;
      const latDelta = maxLat - minLat;
      const zoom = Math.min(
        18,
        Math.max(
          10,
          Math.log2(360 / Math.max(lonDelta, latDelta))
        )
      );
      
      cameraRef.current.flyTo([centerLon, centerLat], 1000);
      // Note: Padding would need to be handled via Camera component separately
    }
  };

  const fetchRoute = async (
    origin: { latitude: number; longitude: number },
    dest: { latitude: number; longitude: number }
  ) => {
    setDirectionsLoading(true);
    try {
      const extra: any = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra || {};
      const orsKey: string | undefined = extra?.ORS_API_KEY || extra?.orsApiKey;

      if (orsKey) {
        console.log('Routing via ORS');
        const body = {
          coordinates: [
            [origin.longitude, origin.latitude],
            [dest.longitude, dest.latitude],
          ],
        };
        const orsRes = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking', {
          method: 'POST',
          headers: {
            'Authorization': orsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (orsRes.ok) {
          const orsData = await orsRes.json();
          const feature = Array.isArray(orsData?.features) ? orsData.features[0] : undefined;
          const summary = feature?.properties?.summary;
          const geom = feature?.geometry;
          let coords: Array<{ latitude: number; longitude: number }> = [];
          if (geom?.type === 'LineString' && Array.isArray(geom.coordinates)) {
            coords = geom.coordinates.map((c: any) => ({ latitude: c[1], longitude: c[0] }));
          } else if (typeof geom === 'string') {
            coords = decodePolyline(geom as string);
          }
          if (coords.length > 1) {
            setRouteCoords(coords);
            setRouteDistance(typeof summary?.distance === 'number' ? summary.distance : null);
            setRouteDuration(typeof summary?.duration === 'number' ? summary.duration : null);
            fitMapToPoints(origin, dest, coords);
            return;
          }
        }
      }

      console.log('Routing via OSRM fallback');
      const url = `https://router.project-osrm.org/route/v1/foot/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=polyline&alternatives=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.code && data.code !== 'Ok') {
        setRouteCoords([]);
        setRouteDistance(null);
        setRouteDuration(null);
        return;
      }
      const route = data?.routes?.[0];
      const points = route?.geometry;
      if (points) {
        const coords = decodePolyline(points);
        setRouteCoords(coords);
        setRouteDistance(typeof route.distance === 'number' ? route.distance : null);
        setRouteDuration(typeof route.duration === 'number' ? route.duration : null);
        fitMapToPoints(origin, dest, coords);
      } else {
        setRouteCoords([]);
        setRouteDistance(null);
        setRouteDuration(null);
      }
    } catch (e) {
      setRouteCoords([]);
      setRouteDistance(null);
      setRouteDuration(null);
    } finally {
      setDirectionsLoading(false);
    }
  };

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
      const lat = currentLocation?.latitude;
      const lon = currentLocation?.longitude;
      const hasNumber = /\d/.test(input);

      // Photon primary call (bias near user, focus on house/street if number present)
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}${lat && lon ? `&lat=${lat}&lon=${lon}` : ''}&limit=6&lang=en${hasNumber ? `&layer=house,street,address` : ''}`;
      const pRes = await fetch(photonUrl);
      const pData = await pRes.json();
      const photon: LocationSuggestion[] = (pData?.features || []).map((f: any) => ({
        description: [f?.properties?.name, f?.properties?.housenumber, f?.properties?.street, f?.properties?.city, f?.properties?.state, f?.properties?.country].filter(Boolean).join(', '),
        latitude: Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates[1] : undefined,
        longitude: Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates[0] : undefined,
      }));

      // Nominatim fallback (bounded around user) when house-level likely
      let nominatim: LocationSuggestion[] = [];
      if (hasNumber) {
        let viewbox = '';
        if (lat && lon) {
          const latDelta = 0.05; // ~5-6km
          const lonDelta = 0.05 / Math.max(Math.cos((lat * Math.PI) / 180), 0.3);
          const left = lon - lonDelta;
          const right = lon + lonDelta;
          const top = lat + latDelta;
          const bottom = lat - latDelta;
          viewbox = `&viewbox=${left},${top},${right},${bottom}&bounded=1`;
        }
        const nUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=5${viewbox}`;
        const nRes = await fetch(nUrl, { headers: { 'User-Agent': 'MoveMates/1.0 (contact@movemates.app)' } });
        const nData = await nRes.json();
        nominatim = (Array.isArray(nData) ? nData : []).map((it: any) => ({
          description: [it?.display_name].filter(Boolean).join(', '),
          latitude: it?.lat ? parseFloat(it.lat) : undefined,
          longitude: it?.lon ? parseFloat(it.lon) : undefined,
        }));
      }

      // Merge + dedupe (by description)
      const mergedMap: Record<string, LocationSuggestion> = {};
      [...photon, ...nominatim].forEach((s) => {
        if (!s.description) return;
        const key = s.description.toLowerCase();
        if (!mergedMap[key]) mergedMap[key] = s;
      });
      const suggestions = Object.values(mergedMap).slice(0, 8);

      if (isPickup) {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } else {
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Handle pickup input change
  const handlePickupChange = (text: string) => {
    setPickup(text);
    setPickupCoord(null);
    if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
    pickupDebounceRef.current = setTimeout(async () => {
      fetchLocationSuggestions(text, true);
      const q = text.trim();
      if (q.length >= 3) {
        try {
          const coords = await geocodeText(q);
          setPickupCoord(coords);
        } catch {
          setPickupCoord(null);
        }
      }
    }, 350);
  };

  // Handle destination input change
  const handleDestinationChange = (text: string) => {
    setDestination(text);
    setDestinationCoord(null);
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    destDebounceRef.current = setTimeout(async () => {
      fetchLocationSuggestions(text, false);
      const q = text.trim();
      if (q.length >= 3) {
        try {
          const coords = await geocodeText(q);
          setDestinationCoord(coords);
        } catch {
          setDestinationCoord(null);
        }
      }
    }, 350);
  };

  // Select suggestion
  const selectSuggestion = async (suggestion: string | LocationSuggestion, isPickup: boolean) => {
    const isObj = typeof suggestion === 'object';
    const text = isObj ? (suggestion as LocationSuggestion).description : suggestion;
    const lat = isObj ? (suggestion as LocationSuggestion).latitude : undefined;
    const lon = isObj ? (suggestion as LocationSuggestion).longitude : undefined;
    if (isPickup) {
      setPickup(text);
      setShowPickupSuggestions(false);
    } else {
      setDestination(text);
      setShowDestinationSuggestions(false);
    }

    const user = auth.currentUser;
    if (user) {
      const updatedRecent = [text, ...recentLocations.filter(loc => loc !== text)].slice(0, 5);
      await updateDoc(doc(db, 'users', user.uid), {
        recentLocations: updatedRecent,
      }).catch(() => {});
    }

    let coords: { latitude: number; longitude: number } | null = null;
    try {
      if (typeof lat === 'number' && typeof lon === 'number') {
        coords = { latitude: lat, longitude: lon };
      } else {
        coords = await geocodeText(text);
      }
    } catch (e) {
      coords = null;
    }
    if (coords) {
      if (isPickup) setPickupCoord(coords); else setDestinationCoord(coords);
      fitMapToPoints(isPickup ? coords : (pickupCoord || coords), isPickup ? (destinationCoord || coords) : coords);
      const origin = isPickup ? coords : pickupCoord;
      let dest = isPickup ? destinationCoord : coords;
      // If user selected destination first and pickup is empty, default pickup to current location
      if (!isPickup && !pickupCoord && currentLocation) {
        setPickupCoord(currentLocation);
      }
      if (enableRoutingStep && origin && dest) {
        await fetchRoute(origin, dest);
      }
    }
  };

  // Use current location for pickup
  const useCurrentLocationForPickup = () => {
    if (currentAddress) {
      setPickup(currentAddress);
      setShowPickupSuggestions(false);
      if (currentLocation) {
        setPickupCoord(currentLocation);
        if (destinationCoord) {
          if (enableRoutingStep) {
            fetchRoute(currentLocation, destinationCoord);
          }
          fitMapToPoints(currentLocation, destinationCoord);
        } else {
          fitMapToPoints(currentLocation, currentLocation);
        }
      }
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

  // Don't render MapView until location is ready
  if (!isLocationReady || !currentLocation) {
    return (
      <SafeAreaView style={{flex:1, backgroundColor:'#FFF', paddingTop: 32, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading map...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#FFF', paddingTop: 32}}>
      {/* Map */}
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        onDidFinishLoadingStyle={() => {
          console.log('Map style loaded');
        }}
      >
        <Mapbox.Camera
          zoomLevel={13}
          centerCoordinate={[currentLocation.longitude, currentLocation.latitude]}
          animationMode="flyTo"
          animationDuration={0}
        />
        {locationPermission && (
          <Mapbox.UserLocation visible={true} />
        )}
        {pickupCoord && (
          <Mapbox.PointAnnotation
            id="pickup"
            coordinate={[pickupCoord.longitude, pickupCoord.latitude]}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerPin, { backgroundColor: '#4CAF50' }]} />
            </View>
          </Mapbox.PointAnnotation>
        )}
        {destinationCoord && (
          <Mapbox.PointAnnotation
            id="destination"
            coordinate={[destinationCoord.longitude, destinationCoord.latitude]}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerPin, { backgroundColor: '#FF0000' }]} />
            </View>
          </Mapbox.PointAnnotation>
        )}
        {routeCoords.length > 1 && (
          <Mapbox.ShapeSource
            id="route"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoords.map(coord => [coord.longitude, coord.latitude]),
              },
            }}
          >
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: '#1E88E5',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Destination Walk</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Locate Me FAB (works on both iOS and Android) */}
      <TouchableOpacity
        style={styles.locateFab}
        onPress={recenterToUser}
        activeOpacity={0.8}
      >
        <MaterialIcons name="my-location" size={22} color="#000" />
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
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={useCurrentLocationForPickup}
              >
                <MaterialIcons name="my-location" size={14} color="#000" />
                <Text style={styles.currentLocationText}>Use Current</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="my-location" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={pickup}
                onChangeText={handlePickupChange}
                placeholder={t('enterPickup')}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('LocationSearch', {
                  isPickup: true,
                  currentLocation,
                  recentLocations,
                  onLocationSelect: (location: string, coords: { latitude: number; longitude: number }) => {
                    setPickup(location);
                    setPickupCoord(coords);
                    if (destinationCoord && enableRoutingStep) {
                      fetchRoute(coords, destinationCoord);
                    }
                  },
                })}
              >
                <MaterialIcons name="search" size={24} color="#666" />
              </TouchableOpacity>
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
                    onPress={() => selectSuggestion(suggestion, true)}
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
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={destination}
                onChangeText={handleDestinationChange}
                placeholder={t('enterDestination')}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('LocationSearch', {
                  isPickup: false,
                  currentLocation,
                  recentLocations,
                  onLocationSelect: (location: string, coords: { latitude: number; longitude: number }) => {
                    setDestination(location);
                    setDestinationCoord(coords);
                    if (pickupCoord && enableRoutingStep) {
                      fetchRoute(pickupCoord, coords);
                    } else if (!pickupCoord && currentLocation) {
                      setPickupCoord(currentLocation);
                    }
                  },
                })}
              >
                <MaterialIcons name="search" size={24} color="#666" />
              </TouchableOpacity>
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
                    onPress={() => selectSuggestion(suggestion, false)}
                  >
                    <MaterialIcons name="place" size={18} color="#666" />
                    <Text style={styles.suggestionText}>{suggestion.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {routeDistance != null && routeDuration != null && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.routeInfo}>
                Distance: {(routeDistance / 1000).toFixed(1)} km  •  ETA: {Math.max(1, Math.round(routeDuration / 60))} min
              </Text>
            </View>
          )}

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
                navigation.navigate('RequestWalk');
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
  locateFab: {
    position: 'absolute',
    top: 120,
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
  routeInfo: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default WandererHomeScreen;
