import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type LocationSharingScreenProps = {
  navigation: StackNavigationProp<any>;
};

const LocationSharingScreen: React.FC<LocationSharingScreenProps> = ({ navigation }) => {
  const [locationSharing, setLocationSharing] = useState(true);
  const [liveTracking, setLiveTracking] = useState(true);
  const [shareWithWalker, setShareWithWalker] = useState(true);
  const [shareWithWanderer, setShareWithWanderer] = useState(true);
  const [preciseLocation, setPreciseLocation] = useState(false);

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
            onValueChange={setLocationSharing}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={locationSharing ? '#22C55E' : '#F3F4F6'}
          />
        </View>

        {/* Sharing Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sharing Options</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="my-location" size={24} color="#EF4444" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Live Tracking</Text>
                <Text style={styles.settingDescription}>
                  Share real-time location during walks
                </Text>
              </View>
            </View>
            <Switch
              value={liveTracking}
              onValueChange={setLiveTracking}
              disabled={!locationSharing}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={liveTracking ? '#22C55E' : '#F3F4F6'}
            />
          </View>

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
        </View>

        {/* Share With Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share With</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="accessibility-new" size={24} color="#059669" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Share with Walker</Text>
                <Text style={styles.settingDescription}>
                  Let walkers see your location
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

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="directions-walk" size={24} color="#3B82F6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Share with Wanderer</Text>
                <Text style={styles.settingDescription}>
                  Let wanderers see your location
                </Text>
              </View>
            </View>
            <Switch
              value={shareWithWanderer}
              onValueChange={setShareWithWanderer}
              disabled={!locationSharing}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={shareWithWanderer ? '#22C55E' : '#F3F4F6'}
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
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
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
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LocationSharingScreen;
