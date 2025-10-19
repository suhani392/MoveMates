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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('preferences')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
        ) : (
          <>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={[styles.preferenceCard, { backgroundColor: colors.card }]}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="brightness-6" size={24} color={colors.primary} />
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceName, { color: colors.text }]}>{t('darkMode')}</Text>
                <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                  {t('darkModeDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isDark ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Behavior Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Behavior</Text>
          
          <View style={[styles.preferenceCard, { backgroundColor: colors.card }]}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="location-on" size={24} color={colors.success} />
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceName, { color: colors.text }]}>{t('autoLocation')}</Text>
                <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Feedback</Text>
          
          <View style={[styles.preferenceCard, { backgroundColor: colors.card }]}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="volume-up" size={24} color={colors.warning} />
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceName, { color: colors.text }]}>{t('soundEffects')}</Text>
                <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
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

          <View style={[styles.preferenceCard, { backgroundColor: colors.card }]}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="vibration" size={24} color={colors.warning} />
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceName, { color: colors.text }]}>Vibration</Text>
                <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
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
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} activeOpacity={0.8} onPress={handleSave}>
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
