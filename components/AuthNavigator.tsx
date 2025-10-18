import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import WandererHomeScreen from '../screens/WandererHomeScreen';
import WalkerHomeScreen from '../screens/WalkerHomeScreen';
import AdminDashboard from '../screens/AdminDashboard';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';
import HelpPolicyScreen from '../screens/HelpPolicyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import ScheduleDateTimeScreen from '../screens/ScheduleDateTimeScreen';
import ChooseWalkerScreen from '../screens/ChooseWalkerScreen';
import WalkerDetailsScreen from '../screens/WalkerDetailsScreen';
import WalkerRequestedScreen from '../screens/WalkerRequestedScreen';
import WalkerUpdatesScreen from '../screens/WalkerUpdatesScreen';
import WandererDetailsScreen from '../screens/WandererDetailsScreen';
import WandererUpdatesScreen from '../screens/WandererUpdatesScreen';
import ChatScreen from '../screens/ChatScreen';
import RemovedUserScreen from '../screens/RemovedUserScreen';
import RemovedUsersScreen from '../screens/RemovedUsersScreen';
import ProfilePhotoScreen from '../screens/ProfilePhotoScreen';

const Stack = createStackNavigator();

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

  // If user is removed, hard-route to the RemovedUser screen always
  if ((userData as any).status === 'removed') {
    return (
      <Stack.Navigator
        initialRouteName="RemovedUser"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="RemovedUser" component={RemovedUserScreen} />
      </Stack.Navigator>
    );
  }

  // Determine initial route based on role and approval status
  let initialRouteName = 'Home';
  if (userData.role === 'admin') {
    initialRouteName = 'AdminDashboard';
  } else if (userData.role === 'walker') {
    initialRouteName = userData.approved ? 'WalkerHome' : 'PendingApproval';
  } else if (userData.role === 'wanderer') {
    initialRouteName = 'WandererHome';
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WandererHome" component={WandererHomeScreen} />
      <Stack.Screen name="WalkerHome" component={WalkerHomeScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="HelpPolicy" component={HelpPolicyScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
      <Stack.Screen name="ScheduleDateTime" component={ScheduleDateTimeScreen} />
      <Stack.Screen name="ChooseWalker" component={ChooseWalkerScreen} />
      <Stack.Screen name="WalkerDetails" component={WalkerDetailsScreen} />
      <Stack.Screen name="WalkerRequested" component={WalkerRequestedScreen} />
      <Stack.Screen name="WalkerUpdates" component={WalkerUpdatesScreen} />
      <Stack.Screen name="WandererDetails" component={WandererDetailsScreen} />
      <Stack.Screen name="WandererUpdates" component={WandererUpdatesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="RemovedUser" component={RemovedUserScreen} />
      <Stack.Screen name="RemovedUsers" component={RemovedUsersScreen} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthNavigator;