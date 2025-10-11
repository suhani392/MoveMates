import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const PendingApprovalScreen: React.FC = () => {
  const { userData } = useAuth();

  const handleSignOut = async () => {
    await authService.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Awaiting Approval</Text>
      <View style={styles.messageContainer}>
        <Text style={styles.message}>Your walker account is pending admin approval.</Text>
        <Text style={styles.message}>You will be notified once approved.</Text>
        <Text style={styles.spacer}></Text>
        <Text style={styles.message}>We need to make sure all our walkers are trustworthy and reliable.</Text>
        <Text style={styles.message}>In the meantime, feel free to explore more about us:</Text>
        <Text style={styles.link} onPress={() => Linking.openURL('https://aidkriya.com/')}>https://aidkriya.com/</Text>
      </View>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  messageContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  spacer: {
    height: 10,
  },
  signOutButton: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  signOutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default PendingApprovalScreen;