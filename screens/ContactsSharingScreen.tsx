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

type ContactsSharingScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ContactsSharingScreen: React.FC<ContactsSharingScreenProps> = ({ navigation }) => {
  const [contactsSharing, setContactsSharing] = useState(false);
  const [syncContacts, setSyncContacts] = useState(false);
  const [findFriends, setFindFriends] = useState(false);
  const [shareProfile, setShareProfile] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contacts Sharing</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Manage how you share and connect with contacts
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            We respect your privacy. Your contacts are never shared without your permission and are only used to help you connect with friends.
          </Text>
        </View>

        {/* Master Toggle */}
        <View style={[styles.settingCard, styles.masterCard]}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="contacts" size={24} color="#000000" />
            <View style={styles.settingText}>
              <Text style={styles.settingName}>Enable Contacts Sharing</Text>
              <Text style={styles.settingDescription}>
                Allow access to your contacts
              </Text>
            </View>
          </View>
          <Switch
            value={contactsSharing}
            onValueChange={setContactsSharing}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={contactsSharing ? '#22C55E' : '#F3F4F6'}
          />
        </View>

        {/* Contact Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Features</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="sync" size={24} color="#5B21B6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Sync Contacts</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync your phone contacts
                </Text>
              </View>
            </View>
            <Switch
              value={syncContacts}
              onValueChange={setSyncContacts}
              disabled={!contactsSharing}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={syncContacts ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="person-search" size={24} color="#059669" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Find Friends</Text>
                <Text style={styles.settingDescription}>
                  Discover which contacts are using MoveMates
                </Text>
              </View>
            </View>
            <Switch
              value={findFriends}
              onValueChange={setFindFriends}
              disabled={!contactsSharing}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={findFriends ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="account-circle" size={24} color="#3B82F6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Share Profile</Text>
                <Text style={styles.settingDescription}>
                  Let contacts see your profile
                </Text>
              </View>
            </View>
            <Switch
              value={shareProfile}
              onValueChange={setShareProfile}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={shareProfile ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="person-add" size={24} color="#EC4899" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Allow Invites</Text>
                <Text style={styles.settingDescription}>
                  Let others invite you to walks
                </Text>
              </View>
            </View>
            <Switch
              value={allowInvites}
              onValueChange={setAllowInvites}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={allowInvites ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Manage Contacts Button */}
        <TouchableOpacity 
          style={[styles.manageButton, !contactsSharing && styles.disabledButton]}
          disabled={!contactsSharing}
          activeOpacity={0.8}
        >
          <MaterialIcons name="people" size={20} color="#FFFFFF" />
          <Text style={styles.manageButtonText}>Manage Synced Contacts</Text>
        </TouchableOpacity>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <MaterialIcons name="lock" size={20} color="#666666" />
          <Text style={styles.privacyText}>
            Your contacts are encrypted and stored securely. You can delete synced contacts anytime from the app settings.
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
  manageButton: {
    backgroundColor: '#5B21B6',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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

export default ContactsSharingScreen;
