import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

type LocationSharingScreenProps = {
  navigation: StackNavigationProp<any>;
};

const LOCATION_SETTINGS_KEY = '@location_settings';

const LocationSharingScreen: React.FC<LocationSharingScreenProps> = ({ navigation }) => {
  const [locationSharing, setLocationSharing] = useState(true);
  const [shareWithWalker, setShareWithWalker] = useState(true);
  const [preciseLocation, setPreciseLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        setLocationSharing(settings.locationSharing ?? true);
        setShareWithWalker(settings.shareWithWalker ?? true);
        setPreciseLocation(settings.preciseLocation ?? false);
      }
    } catch (error) {
      console.error('Error loading location settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSharingToggle = async (value: boolean) => {
    if (value) {
      // Request location permission when enabling
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to enable location sharing. Please grant permission in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setLocationSharing(value);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const settings = {
        locationSharing,
        shareWithWalker,
        preciseLocation,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(settings));
      
      Alert.alert(
        'Success',
        'Location sharing settings saved successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving location settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Location Sharing</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Control how your location is shared with others
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Location sharing helps walkers and wanderers find each other easily and ensures safety during walks.
          </Text>
        </View>

        {/* Master Toggle */}
        <View style={[styles.settingCard, styles.masterCard]}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="location-on" size={24} color="#000000" />
            <View style={styles.settingText}>
              <Text style={styles.settingName}>Enable Location Sharing</Text>
              <Text style={styles.settingDescription}>
                Allow the app to access your location
              </Text>
            </View>
          </View>
          <Switch
            value={locationSharing}
            onValueChange={handleLocationSharingToggle}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={locationSharing ? '#22C55E' : '#F3F4F6'}
          />
        </View>

        {/* Sharing Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sharing Options</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="gps-fixed" size={24} color="#5B21B6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Precise Location</Text>
                <Text style={styles.settingDescription}>
                  Share exact location instead of approximate
                </Text>
              </View>
            </View>
            <Switch
              value={preciseLocation}
              onValueChange={setPreciseLocation}
              disabled={!locationSharing}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={preciseLocation ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="accessibility-new" size={24} color="#059669" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Share with Walker</Text>
                <Text style={styles.settingDescription}>
                  Let walkers see your location during walks
                </Text>
              </View>
            </View>
            <Switch
              value={shareWithWalker}
              onValueChange={setShareWithWalker}
              disabled={!locationSharing}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={shareWithWalker ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <MaterialIcons name="lock" size={20} color="#666666" />
          <Text style={styles.privacyText}>
            Your location is only shared during active walks and with matched users. We never share your location publicly.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          activeOpacity={0.8}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },
  infoText: {
    fontSize: 13,
    color: '#0369A1',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  masterCard: {
    backgroundColor: '#D9DFF7',
    marginBottom: 30,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  privacyText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
  },
});

export default LocationSharingScreen;
