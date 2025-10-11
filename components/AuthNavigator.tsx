import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import WandererHomeScreen from '../screens/WandererHomeScreen';
import WalkerHomeScreen from '../screens/WalkerHomeScreen';
import AdminDashboard from '../screens/AdminDashboard';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';

const AuthNavigator: React.FC = () => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user || !userData) {
    // User not authenticated, show login screen
    return null; // This will be handled by your main navigation
  }

  // Route based on user role and approval status
  if (userData.role === 'admin') {
    return <AdminDashboard />;
  }

  if (userData.role === 'walker') {
    if (userData.approved) {
      return <WalkerHomeScreen />;
    } else {
      return <PendingApprovalScreen />;
    }
  }

  if (userData.role === 'wanderer') {
    return <WandererHomeScreen />;
  }

  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthNavigator;