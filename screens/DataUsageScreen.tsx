import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type DataUsageScreenProps = {
  navigation: StackNavigationProp<any>;
};

const DataUsageScreen: React.FC<DataUsageScreenProps> = ({ navigation }) => {
  const [autoDownload, setAutoDownload] = useState(false);
  const [highQualityImages, setHighQualityImages] = useState(true);
  const [videoAutoplay, setVideoAutoplay] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will free up storage but may slow down the app temporarily.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Implement cache clearing logic
            Alert.alert('Success', 'Cache cleared successfully!');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all locally stored data including offline content. Your account data will remain safe. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // Implement data clearing logic
            Alert.alert('Success', 'All local data cleared!');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Usage</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Manage your data usage and storage
        </Text>

        {/* Storage Info Card */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <MaterialIcons name="storage" size={28} color="#5B21B6" />
            <Text style={styles.storageTitle}>Storage Usage</Text>
          </View>
          <View style={styles.storageStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24.5 MB</Text>
              <Text style={styles.statLabel}>App Data</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12.8 MB</Text>
              <Text style={styles.statLabel}>Cache</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>37.3 MB</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Data Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="wifi" size={24} color="#3B82F6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>WiFi Only Mode</Text>
                <Text style={styles.settingDescription}>
                  Use data only when connected to WiFi
                </Text>
              </View>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={setWifiOnly}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={wifiOnly ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="cloud-sync" size={24} color="#059669" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Background Sync</Text>
                <Text style={styles.settingDescription}>
                  Sync data in the background
                </Text>
              </View>
            </View>
            <Switch
              value={backgroundSync}
              onValueChange={setBackgroundSync}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={backgroundSync ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Media Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="download" size={24} color="#6366F1" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Auto Download Media</Text>
                <Text style={styles.settingDescription}>
                  Automatically download images and videos
                </Text>
              </View>
            </View>
            <Switch
              value={autoDownload}
              onValueChange={setAutoDownload}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={autoDownload ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="high-quality" size={24} color="#EC4899" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>High Quality Images</Text>
                <Text style={styles.settingDescription}>
                  Load images in high quality (uses more data)
                </Text>
              </View>
            </View>
            <Switch
              value={highQualityImages}
              onValueChange={setHighQualityImages}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={highQualityImages ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="play-circle" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Video Autoplay</Text>
                <Text style={styles.settingDescription}>
                  Automatically play videos
                </Text>
              </View>
            </View>
            <Switch
              value={videoAutoplay}
              onValueChange={setVideoAutoplay}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={videoAutoplay ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Storage Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Management</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleClearCache}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-sweep" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearData}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <MaterialIcons name="info" size={20} color="#666666" />
          <Text style={styles.infoText}>
            Clearing cache may temporarily slow down the app. Clearing all data will require you to re-download content.
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
  storageCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 12,
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5B21B6',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#D1D5DB',
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
  actionButton: {
    backgroundColor: '#5B21B6',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
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

export default DataUsageScreen;
