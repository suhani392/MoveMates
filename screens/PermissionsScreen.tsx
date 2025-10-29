import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PermissionsScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'Permissions'> & {
    params?: {
      selectedRole?: 'walker' | 'wanderer';
      isExistingUser?: boolean;
      redirectTo?: string;
    };
  };
};

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ navigation, route }) => {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const requestPermissions = async () => {
    const results: Record<string, 'granted' | 'denied' | 'unavailable'> = {};

    // Location
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      results.location = status === 'granted' ? 'granted' : 'denied';
    } catch {
      results.location = 'unavailable';
    }

    // Notifications (iOS requires explicit prompt, Android 13+ too)
    try {
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      results.notifications = status === 'granted' ? 'granted' : 'denied';
    } catch {
      results.notifications = 'unavailable';
    }

    // Contacts (optional)
    try {
      const Contacts = require('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      results.contacts = status === 'granted' ? 'granted' : 'denied';
    } catch {
      results.contacts = 'unavailable';
    }

    // Camera & Microphone (optional)
    try {
      const Camera = require('expo-camera');
      const { status } = await Camera.Camera.requestCameraPermissionsAsync();
      results.camera = status === 'granted' ? 'granted' : 'denied';
    } catch {
      results.camera = 'unavailable';
    }
    try {
      const Camera = require('expo-camera');
      const { status } = await Camera.Camera.requestMicrophonePermissionsAsync();
      results.microphone = status === 'granted' ? 'granted' : 'denied';
    } catch {
      results.microphone = 'unavailable';
    }

    try {
      await AsyncStorage.multiSet([
        ['permission.location', results.location],
        ['permission.notifications', results.notifications],
        ['permission.contacts', results.contacts],
        ['permission.camera', results.camera],
        ['permission.microphone', results.microphone],
        ['hasCompletedPermissions', 'true'],
      ]);
    } catch {}

    const target = route?.params?.redirectTo;
    if (target) {
      navigation.reset({ index: 0, routes: [{ name: target as never }] as any });
    } else {
      navigation.navigate('Login', {
        selectedRole: route?.params?.selectedRole,
        isExistingUser: route?.params?.isExistingUser,
      } as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <Text style={styles.title}>Allow Permissions</Text>
        <Text style={styles.subtitle}>
          Select the permissions you would like the app to access :
        </Text>

        <View style={styles.permissionsContainer}>
          {/* Location Permission */}
          <TouchableOpacity
            style={[styles.permissionCard, styles.locationCard]}
            onPress={() => setLocationEnabled(!locationEnabled)}
            activeOpacity={0.8}
          >
            <View style={styles.permissionHeader}>
              <View style={styles.bulletContainer}>
                <View style={[styles.bullet, locationEnabled && styles.bulletActive]} />
              </View>
              <View style={styles.permissionTitleContainer}>
                <Text style={styles.permissionTitle}>Location Permission :</Text>
                <Text style={styles.suggestedTag}>(suggested)</Text>
              </View>
            </View>
            <Text style={styles.permissionDescription}>
              Allow the app to know your location while you are walking with our wanderer to track your route and ensure your safety.
            </Text>
          </TouchableOpacity>

          {/* Contacts Permission */}
          <TouchableOpacity
            style={[styles.permissionCard, styles.contactsCard]}
            onPress={() => setContactsEnabled(!contactsEnabled)}
            activeOpacity={0.8}
          >
            <View style={styles.permissionHeader}>
              <View style={styles.bulletContainer}>
                <View style={[styles.bullet, contactsEnabled && styles.bulletActive]} />
              </View>
              <View style={styles.permissionTitleContainer}>
                <Text style={styles.permissionTitle}>Contacts Permission :</Text>
                <Text style={styles.suggestedTag}>(suggested)</Text>
              </View>
            </View>
            <Text style={[styles.permissionDescription, styles.contactsDescription]}>
              Allow the app to access your contacts to let you know who uses the app and to help you connect with your friends for a better walking experience.
            </Text>
          </TouchableOpacity>

          {/* Notification Permission */}
          <TouchableOpacity
            style={[styles.permissionCard, styles.notificationCard]}
            onPress={() => setNotificationEnabled(!notificationEnabled)}
            activeOpacity={0.8}
          >
            <View style={styles.permissionHeader}>
              <View style={styles.bulletContainer}>
                <View style={[styles.bullet, notificationEnabled && styles.bulletActive]} />
              </View>
              <View style={styles.permissionTitleContainer}>
                <Text style={styles.permissionTitle}>Notification Permission :</Text>
                <Text style={styles.suggestedTag}>(suggested)</Text>
              </View>
            </View>
            <Text style={styles.permissionDescription}>
              Allow the app to notify you when :
            </Text>
            <Text style={styles.permissionListItem}>1. Your walking time is about to start</Text>
            <Text style={styles.permissionListItem}>
              2. Your partner (wanderer) is nearby or has arrived at the location
            </Text>
            <Text style={styles.permissionListItem}>3. Your walking time is about to end</Text>
            <Text style={styles.permissionListItem}>
              4. Other updates related to wanderers or your friends
            </Text>
          </TouchableOpacity>

          {/* Camera & Microphone Permission */}
          <TouchableOpacity
            style={[styles.permissionCard, styles.cameraCard]}
            onPress={() => setCameraEnabled(!cameraEnabled)}
            activeOpacity={0.8}
          >
            <View style={styles.permissionHeader}>
              <View style={styles.bulletContainer}>
                <View style={[styles.bullet, cameraEnabled && styles.bulletActive]} />
              </View>
              <View style={styles.permissionTitleContainer}>
                <Text style={styles.permissionTitle}>Camera & Microphone Permission</Text>
                <Text style={styles.optionalTag}>(optional)</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.allowButton}
          onPress={requestPermissions}
        >
          <Text style={styles.allowButtonText}>Allow the permissions</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionsContainer: {
    marginBottom: 30,
  },
  permissionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: '#E8F5E9',
  },
  contactsCard: {
    backgroundColor: '#FFF3E0',
  },
  notificationCard: {
    backgroundColor: '#E3F2FD',
  },
  cameraCard: {
    backgroundColor: '#E0E0E0',
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletContainer: {
    marginRight: 16,
  },
  bullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  bulletActive: {
    backgroundColor: '#000000',
  },
  permissionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 8,
  },
  suggestedTag: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  optionalTag: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginLeft: 24,
  },
  contactsDescription: {
    color: '#000000',
  },
  permissionListItem: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginLeft: 24,
    marginTop: 4,
  },
  allowButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PermissionsScreen;
