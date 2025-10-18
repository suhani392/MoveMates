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

type PreferencesScreenProps = {
  navigation: StackNavigationProp<any>;
};

const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ navigation }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preferences</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Customize your app experience
        </Text>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="brightness-6" size={24} color="#5B21B6" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Dark Mode</Text>
                <Text style={styles.preferenceDescription}>
                  Enable dark theme for the app
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={darkMode ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Behavior Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavior</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="check-circle" size={24} color="#059669" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Auto Accept Requests</Text>
                <Text style={styles.preferenceDescription}>
                  Automatically accept walk requests (Walker only)
                </Text>
              </View>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={autoAccept ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="refresh" size={24} color="#3B82F6" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Auto Refresh</Text>
                <Text style={styles.preferenceDescription}>
                  Automatically refresh updates
                </Text>
              </View>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={autoRefresh ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="visibility" size={24} color="#6366F1" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Show Online Status</Text>
                <Text style={styles.preferenceDescription}>
                  Let others see when you're online
                </Text>
              </View>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={showOnlineStatus ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="volume-up" size={24} color="#F59E0B" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Sound Effects</Text>
                <Text style={styles.preferenceDescription}>
                  Play sounds for notifications
                </Text>
              </View>
            </View>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={soundEffects ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="vibration" size={24} color="#EC4899" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Vibration</Text>
                <Text style={styles.preferenceDescription}>
                  Vibrate for notifications
                </Text>
              </View>
            </View>
            <Switch
              value={vibration}
              onValueChange={setVibration}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={vibration ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
    marginBottom: 25,
    lineHeight: 20,
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
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  preferenceText: {
    marginLeft: 15,
    flex: 1,
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
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

export default PreferencesScreen;
