import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapLibreGL, { CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_STYLE_URL,
  isMapLibreSupported,
  toPosition,
  type LatLng,
} from '../utils/mapLibre';
import MapFallback from '../components/MapFallback';

type SuggestiveWalkScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface LocationSuggestion {
  description: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}

const SuggestiveWalkScreen: React.FC<SuggestiveWalkScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [meetingPoint, setMeetingPoint] = useState('');
  const [meetingPointCoord, setMeetingPointCoord] = useState<LatLng | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState('');
  const [suggestionType, setSuggestionType] = useState('');
  const [suggestionCategory, setSuggestionCategory] = useState('');
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [locationPermission, setLocationPermission] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const cameraRef = useRef<CameraRef | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const durationPresets = [15, 30, 60];
  const defaultCameraCenter = currentLocation ?? MAP_DEFAULT_CENTER;

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use the map.');
        return;
      }
      setLocationPermission(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);

      cameraRef.current?.setCamera({
        centerCoordinate: toPosition(coords),
        zoomLevel: 14,
        animationDuration: 1000,
      });

      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setCurrentAddress(address);
    })();
  }, []);

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

  // Load recent locations
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = collection(db, 'users');
    const userQuery = query(userRef, where('__name__', '==', user.uid));
    
    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setRecentLocations(data?.recentLocations || []);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const fetchLocationSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const lat = currentLocation?.latitude;
      const lon = currentLocation?.longitude;
      const hasNumber = /\d/.test(input);

      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}${lat && lon ? `&lat=${lat}&lon=${lon}` : ''}&limit=6&lang=en${hasNumber ? `&layer=house,street,address` : ''}`;
      const pRes = await fetch(photonUrl);
      const pData = await pRes.json();
      const photon: LocationSuggestion[] = (pData?.features || []).map((f: any) => ({
        description: [f?.properties?.name, f?.properties?.housenumber, f?.properties?.street, f?.properties?.city, f?.properties?.state, f?.properties?.country].filter(Boolean).join(', '),
        latitude: Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates[1] : undefined,
        longitude: Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates[0] : undefined,
      }));

      setSuggestions(photon.slice(0, 8));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleMeetingPointChange = (text: string) => {
    setMeetingPoint(text);
    setMeetingPointCoord(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      fetchLocationSuggestions(text);
      const q = text.trim();
      if (q.length >= 3) {
        try {
          const coords = await geocodeText(q);
          setMeetingPointCoord(coords);
        } catch {
          setMeetingPointCoord(null);
        }
      }
    }, 350);
  };

  const selectSuggestion = async (suggestion: string | LocationSuggestion) => {
    const isObj = typeof suggestion === 'object';
    const text = isObj ? (suggestion as LocationSuggestion).description : suggestion;
    const lat = isObj ? (suggestion as LocationSuggestion).latitude : undefined;
    const lon = isObj ? (suggestion as LocationSuggestion).longitude : undefined;

    setMeetingPoint(text);
    setShowSuggestions(false);

    let coords: LatLng | null = null;
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
      setMeetingPointCoord(coords);
      cameraRef.current?.setCamera({
        centerCoordinate: toPosition(coords),
        zoomLevel: 15,
        animationDuration: 500,
      });
    }
  };

  const useCurrentLocationForMeetingPoint = () => {
    if (currentAddress) {
      setMeetingPoint(currentAddress);
      setShowSuggestions(false);
      if (currentLocation) {
        setMeetingPointCoord(currentLocation);
        cameraRef.current?.setCamera({
          centerCoordinate: toPosition(currentLocation),
          zoomLevel: 15,
          animationDuration: 500,
        });
      }
    }
  };

  const recenterToUser = () => {
    if (!currentLocation || !cameraRef.current) {
      Alert.alert('Location Unavailable', 'Enable location services to use this feature.');
      return;
    }
    cameraRef.current.setCamera({
      centerCoordinate: toPosition(currentLocation),
      zoomLevel: 15,
      animationDuration: 500,
    });
  };

  const handleContinue = () => {
    if (!meetingPoint.trim()) {
      Alert.alert('Missing Information', 'Please enter a meeting point.');
      return;
    }

    const finalDuration = selectedDuration || parseInt(customDuration);
    if (!finalDuration || finalDuration <= 0) {
      Alert.alert('Missing Information', 'Please select or enter a valid duration.');
      return;
    }

    if (!suggestionType.trim()) {
      Alert.alert('Missing Information', 'Please specify what type of suggestion you need.');
      return;
    }

    if (!suggestionCategory.trim()) {
      Alert.alert('Missing Information', 'Please specify the category for suggestions.');
      return;
    }

    navigation.navigate('ScheduleDateTime', {
      walkType: 'suggestiveWalk',
      meetingPoint: meetingPoint.trim(),
      meetingPointCoord,
      duration: finalDuration,
      suggestionType: suggestionType.trim(),
      suggestionCategory: suggestionCategory.trim(),
    });
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#FFF', paddingTop: 32}}>
      {/* Map */}
      {isMapLibreSupported ? (
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
          {meetingPointCoord && (
            <MapLibreGL.PointAnnotation
              id="suggestive-walk-meeting"
              coordinate={toPosition(meetingPointCoord)}
            >
              <View style={styles.pointAnnotation}>
                <MaterialIcons name="place" size={18} color="#FFFFFF" />
              </View>
            </MapLibreGL.PointAnnotation>
          )}
        </MapLibreGL.MapView>
      ) : (
        <View style={styles.map}>
          <MapFallback />
        </View>
      )}

      {/* Header with black 60% opacity */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suggestive Walk</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Locate Me FAB */}
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Meeting Point */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('meetingPoint')}</Text>
                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={useCurrentLocationForMeetingPoint}
                >
                  <MaterialIcons name="my-location" size={14} color="#000" />
                  <Text style={styles.currentLocationText}>Use Current</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="place" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={meetingPoint}
                  onChangeText={handleMeetingPointChange}
                  placeholder={t('enterMeetingPoint')}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate('LocationSearch', {
                    isPickup: true,
                    currentLocation,
                    recentLocations,
                    onLocationSelect: (location: string, coords: { latitude: number; longitude: number }) => {
                      setMeetingPoint(location);
                      setMeetingPointCoord(coords);
                    },
                  })}
                >
                  <MaterialIcons name="search" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Suggestions */}
              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {recentLocations.length > 0 && !meetingPoint && (
                    <>
                      <Text style={styles.suggestionHeader}>Recent Locations</Text>
                      {recentLocations.map((location, index) => (
                        <TouchableOpacity
                          key={`recent-${index}`}
                          style={styles.suggestionItem}
                          onPress={() => selectSuggestion(location)}
                        >
                          <MaterialIcons name="history" size={18} color="#666" />
                          <Text style={styles.suggestionText}>{location}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(suggestion)}
                    >
                      <MaterialIcons name="place" size={18} color="#666" />
                      <Text style={styles.suggestionText}>{suggestion.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Duration */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('duration')}</Text>
              <View style={styles.durationPresetsRow}>
                {durationPresets.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationChip,
                      selectedDuration === duration && styles.durationChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedDuration(duration);
                      setCustomDuration('');
                    }}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        selectedDuration === duration && styles.durationTextSelected,
                      ]}
                    >
                      {duration} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.customDurationRow}>
                <Text style={styles.customLabel}>Custom:</Text>
                <TextInput
                  style={[styles.customInput, { backgroundColor: colors.card, color: colors.text }]}
                  value={customDuration}
                  onChangeText={(text) => {
                    setCustomDuration(text);
                    setSelectedDuration(null);
                  }}
                  placeholder="Enter minutes"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Suggestion Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Type of Suggestion</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lightbulb-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={suggestionType}
                  onChangeText={setSuggestionType}
                  placeholder="e.g., Best restaurants, Shopping areas, etc."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Suggestion Category */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="category" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={suggestionCategory}
                  onChangeText={setSuggestionCategory}
                  placeholder="e.g., Food, Entertainment, Health, etc."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  pointAnnotation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  headerButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    maxHeight: '65%',
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
  durationPresetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  durationChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  durationChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  durationTextSelected: {
    color: '#FFFFFF',
  },
  customDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SuggestiveWalkScreen;
