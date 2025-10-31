import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

type LanguageScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface Language {
  code: 'en' | 'hi';
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

const LanguageScreen: React.FC<LanguageScreenProps> = ({ navigation }) => {
  const { language, setLanguage, t } = useLanguage();
  const { colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>(language);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const handleLanguageSelect = (code: 'en' | 'hi') => {
    setSelectedLanguage(code);
  };

  const handleSave = async () => {
    try {
      await setLanguage(selectedLanguage);
      Alert.alert(t('success'), t('languageUpdated'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('error'), 'Failed to update language');
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('language')}</Text>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('selectLanguage')}
        </Text>

        {/* Language List */}
        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedLanguage === language.code && { borderColor: colors.success },
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: colors.text }]}>{language.name}</Text>
                <Text style={[styles.languageNative, { color: colors.textSecondary }]}>{language.nativeName}</Text>
              </View>
              {selectedLanguage === language.code && (
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={18} color="#0B5ED7" style={{ marginRight: 8 }} />
          <Text style={styles.infoBannerText}>Language changes are coming soon. Thank you for your understanding.</Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
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
  languageList: {
    marginBottom: 30,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: '#E8F6E9',
    borderColor: '#4CAF50',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 14,
    color: '#666666',
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E7F1FF',
    borderWidth: 1,
    borderColor: '#CFE2FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  infoBannerText: {
    color: '#0B5ED7',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});

export default LanguageScreen;
