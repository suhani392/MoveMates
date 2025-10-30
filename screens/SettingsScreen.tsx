import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

type SettingsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('general')}</Text>
          <TouchableOpacity 
            style={[styles.card, styles.generalCard]}
            onPress={() => navigation.navigate('Language')}
          >
            <Text style={styles.cardText}>{t('language')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.generalCard]}
            onPress={() => navigation.navigate('RoleChange')}
          >
            <Text style={styles.cardText}>{t('roleChange')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.generalCard]}
            onPress={() => navigation.navigate('Preferences')}
          >
            <Text style={styles.cardText}>{t('preferences')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <TouchableOpacity 
            style={[styles.card, styles.notificationCard]}
            onPress={() => navigation.navigate('PushNotifications')}
          >
            <Text style={styles.cardText}>{t('pushNotifications')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.notificationCard]}
            onPress={() => navigation.navigate('EmailNotifications')}
          >
            <Text style={styles.cardText}>{t('emailNotifications')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('privacy')}</Text>
          <TouchableOpacity 
            style={[styles.card, styles.privacyCard]}
            onPress={() => navigation.navigate('LocationSharing')}
          >
            <Text style={styles.cardText}>{t('locationSharing')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.privacyCard]}
            onPress={() => navigation.navigate('ContactsSharing')}
          >
            <Text style={styles.cardText}>{t('contactsSharing')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.privacyCard]}
            onPress={() => navigation.navigate('DataUsage')}
          >
            <Text style={styles.cardText}>{t('dataUsage')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('history')}</Text>
          <TouchableOpacity 
            style={[styles.card, styles.historyCard]}
            onPress={() => navigation.navigate('WalkHistory')}
          >
            <Text style={styles.cardText}>{t('walkHistory')}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
  },
  generalCard: {
    backgroundColor: '#E8F6E9',
  },
  notificationCard: {
    backgroundColor: '#F7EDD9',
  },
  privacyCard: {
    backgroundColor: '#D9DFF7',
  },
  historyCard: {
    backgroundColor: '#F5F5F5',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
});

export default SettingsScreen;
