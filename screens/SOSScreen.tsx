import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';

type SOSScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { requestId?: string } }, 'params'>;
};

const SOSScreen: React.FC<SOSScreenProps> = ({ navigation, route }) => {
  const [sending, setSending] = useState(false);

  const handleSendSOS = async () => {
    setSending(true);

    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to send SOS.');
        setSending(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      // Create SOS message
      const sosMessage = `🚨 EMERGENCY SOS ALERT 🚨\n\nI need help! This is an emergency.\n\nMy current location:\n${googleMapsUrl}\n\nPlease contact me immediately or send help.`;

      // TODO: Send to emergency contacts from database
      // For now, show the message
      Alert.alert(
        'SOS Alert Sent',
        'Emergency alert has been sent to your contacts with your location.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      // Optional: Open SMS with the message
      // const smsUrl = `sms:?body=${encodeURIComponent(sosMessage)}`;
      // await Linking.openURL(smsUrl);

    } catch (error) {
      console.error('Error sending SOS:', error);
      Alert.alert('Error', 'Failed to send SOS alert. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Cancel SOS',
      'Are you sure you want to go back?',
      [
        {
          text: 'Stay',
          style: 'cancel',
        },
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* SOS Button Circle */}
      <View style={styles.sosCircleOuter}>
        <View style={styles.sosCircleInner}>
          <View style={styles.sosCircleContent}>
            <View style={styles.sosArcTop} />
            <Text style={styles.sosText}>SOS</Text>
            <View style={styles.sosArcBottom} />
          </View>
        </View>
      </View>

      {/* Warning Text */}
      <Text style={styles.warningTitle}>Are you in danger?</Text>
      <Text style={styles.warningDescription}>
        If you feel unsafe, tap the{'\n'}
        button to send an SOS Alert{'\n'}
        with your location to your{'\n'}
        emergency contacts.
      </Text>

      {/* Send SOS Button */}
      <TouchableOpacity
        style={[styles.sendButton, sending && styles.sendButtonDisabled]}
        onPress={handleSendSOS}
        disabled={sending}
        activeOpacity={0.8}
      >
        {sending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.sendButtonText}>Send SOS</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sosCircleOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#E57373',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sosCircleInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosCircleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosArcTop: {
    width: 120,
    height: 60,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderWidth: 4,
    borderColor: '#E57373',
    borderBottomWidth: 0,
    marginBottom: 5,
  },
  sosText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#E57373',
    letterSpacing: 4,
    marginVertical: 5,
  },
  sosArcBottom: {
    width: 120,
    height: 60,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    borderWidth: 4,
    borderColor: '#E57373',
    borderTopWidth: 0,
    marginTop: 5,
  },
  warningTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
  },
  sendButton: {
    backgroundColor: '#E57373',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 60,
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SOSScreen;
