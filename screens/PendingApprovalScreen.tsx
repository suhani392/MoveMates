import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
      <Text style={styles.message}>
        Your walker account is pending admin approval. 
        You will be notified once approved.
      </Text>
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
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
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
});

export default PendingApprovalScreen;