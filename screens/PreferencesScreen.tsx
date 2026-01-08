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
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

type PreferencesScreenProps = {
  navigation: StackNavigationProp<any>;
};

const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ navigation }) => {
  const { toggleTheme, isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [autoLocation, setAutoLocation] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const prefs = userDoc.data()?.preferences || {};
        setAutoLocation(prefs.autoLocation || false);
        setSoundEffects(prefs.soundEffects !== false);
        setVibration(prefs.vibration !== false);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          'preferences.darkMode': isDark,
          'preferences.autoLocation': autoLocation,
          'preferences.soundEffects': soundEffects,
          'preferences.vibration': vibration,
        });
        Alert.alert(t('success'), t('settingsSaved'));
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(t('error'), 'Failed to save preferences');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('preferences')}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Customize your app experience
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
        ) : (
          <>
        {/* Behavior Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavior</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="location-on" size={24} color="#059669" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>{t('autoLocation')}</Text>
                <Text style={styles.preferenceDescription}>
                  {t('autoLocationDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={autoLocation}
              onValueChange={setAutoLocation}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={autoLocation ? '#22C55E' : '#F3F4F6'}
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
                <Text style={styles.preferenceName}>{t('soundEffects')}</Text>
                <Text style={styles.preferenceDescription}>
                  {t('soundEffectsDesc')}
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
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
        </>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
  },
});

export default PreferencesScreen;
