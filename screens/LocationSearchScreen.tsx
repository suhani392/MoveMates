import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import { updateDoc, doc } from 'firebase/firestore';

type LocationSearchScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{
    params: {
      isPickup: boolean;
      currentLocation: { latitude: number; longitude: number } | null;
      recentLocations: string[];
      onLocationSelect: (location: string, coords: { latitude: number; longitude: number }) => void;
    };
  }>;
};

interface LocationSuggestion {
  description: string;
  latitude?: number;
  longitude?: number;
}

const LocationSearchScreen: React.FC<LocationSearchScreenProps> = ({ navigation, route }) => {
  const { isPickup, currentLocation, recentLocations, onLocationSelect } = route.params;
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Popular locations in India
  const popularLocations = [
    { name: 'India Gate, New Delhi', latitude: 28.6129, longitude: 77.2295 },
    { name: 'Gateway of India, Mumbai', latitude: 18.9220, longitude: 72.8347 },
    { name: 'Taj Mahal, Agra', latitude: 27.1751, longitude: 78.0421 },
    { name: 'Hawa Mahal, Jaipur', latitude: 26.9239, longitude: 75.8267 },
    { name: 'Marina Beach, Chennai', latitude: 13.0499, longitude: 80.2824 },
    { name: 'Charminar, Hyderabad', latitude: 17.3616, longitude: 78.4747 },
    { name: 'Victoria Memorial, Kolkata', latitude: 22.5448, longitude: 88.3426 },
    { name: 'Mysore Palace, Mysore', latitude: 12.3051, longitude: 76.6551 },
  ];

  // Geocode text to coordinates
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

  // Fetch location suggestions
  const fetchLocationSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const lat = currentLocation?.latitude;
      const lon = currentLocation?.longitude;
      const hasNumber = /\d/.test(input);

      // Photon primary call
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}${lat && lon ? `&lat=${lat}&lon=${lon}` : ''}&limit=8&lang=en${hasNumber ? `&layer=house,street,address` : ''}`;
      const pRes = await fetch(photonUrl);
      const pData = await pRes.json();
      const photon: LocationSuggestion[] = (pData?.features || []).map((f: any) => ({
        description: [f?.properties?.name, f?.properties?.housenumber, f?.properties?.street, f?.properties?.city, f?.properties?.state, f?.properties?.country].filter(Boolean).join(', '),
        latitude: Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates[1] : undefined,
        longitude: Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates[0] : undefined,
      }));

      // Nominatim fallback
      let nominatim: LocationSuggestion[] = [];
      if (hasNumber) {
        let viewbox = '';
        if (lat && lon) {
          const latDelta = 0.05;
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

      // Merge + dedupe
      const mergedMap: Record<string, LocationSuggestion> = {};
      [...photon, ...nominatim].forEach((s) => {
        if (!s.description) return;
        const key = s.description.toLowerCase();
        if (!mergedMap[key]) mergedMap[key] = s;
      });
      setSuggestions(Object.values(mergedMap).slice(0, 10));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search text change with debounce
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(text);
    }, 350);
  };

  // Handle location selection
  const handleLocationSelect = async (location: string, coords?: { latitude: number; longitude: number }) => {
    try {
      let finalCoords = coords;
      if (!finalCoords) {
        finalCoords = await geocodeText(location);
      }

      // Update recent locations in Firestore
      const user = auth.currentUser;
      if (user) {
        const updatedRecent = [location, ...recentLocations.filter(loc => loc !== location)].slice(0, 5);
        await updateDoc(doc(db, 'users', user.uid), {
          recentLocations: updatedRecent,
        }).catch(() => {});
      }

      // Call the callback and navigate back
      onLocationSelect(location, finalCoords);
      navigation.goBack();
    } catch (error) {
      console.error('Error selecting location:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isPickup ? 'Select Pickup Location' : 'Select Destination'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearchChange}
          placeholder="Search for a location..."
          placeholderTextColor="#999"
          autoFocus
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recent Locations */}
        {!searchText && recentLocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Locations</Text>
            {recentLocations.map((location, index) => (
              <TouchableOpacity
                key={`recent-${index}`}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(location)}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="history" size={24} color="#666" />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationText}>{location}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Popular Locations */}
        {!searchText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Locations</Text>
            {popularLocations.map((location, index) => (
              <TouchableOpacity
                key={`popular-${index}`}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(location.name, {
                  latitude: location.latitude,
                  longitude: location.longitude,
                })}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="place" size={24} color="#3B82F6" />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationText}>{location.name}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Results */}
        {searchText.length >= 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={`suggestion-${index}`}
                  style={styles.locationItem}
                  onPress={() => handleLocationSelect(suggestion.description, 
                    suggestion.latitude && suggestion.longitude 
                      ? { latitude: suggestion.latitude, longitude: suggestion.longitude }
                      : undefined
                  )}
                >
                  <View style={styles.iconContainer}>
                    <MaterialIcons name="place" size={24} color="#666" />
                  </View>
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationText}>{suggestion.description}</Text>
                  </View>
                  <MaterialIcons name="arrow-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={48} color="#CCCCCC" />
                <Text style={styles.noResultsText}>No locations found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default LocationSearchScreen;
