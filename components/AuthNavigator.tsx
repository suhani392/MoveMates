import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import RequestWalkScreen from '../screens/RequestWalkScreen';
import WandererHomeScreen from '../screens/WandererHomeScreen';
import NearbyWalkScreen from '../screens/NearbyWalkScreen';
import HelpingHandScreen from '../screens/HelpingHandScreen';
import SuggestiveWalkScreen from '../screens/SuggestiveWalkScreen';
import ExploringWalkScreen from '../screens/ExploringWalkScreen';
import WalkerHomeScreen from '../screens/WalkerHomeScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
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
import RequestAcceptedScreen from '../screens/RequestAcceptedScreen';
import ChatScreen from '../screens/ChatScreen';
import RemovedUserScreen from '../screens/RemovedUserScreen';
import RemovedUsersScreen from '../screens/RemovedUsersScreen';
import ProfilePhotoScreen from '../screens/ProfilePhotoScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import RoleChangeScreen from '../screens/RoleChangeScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import PushNotificationsScreen from '../screens/PushNotificationsScreen';
import EmailNotificationsScreen from '../screens/EmailNotificationsScreen';
import LocationSharingScreen from '../screens/LocationSharingScreen';
import ContactsSharingScreen from '../screens/ContactsSharingScreen';
import DataUsageScreen from '../screens/DataUsageScreen';
import WalkHistoryScreen from '../screens/WalkHistoryScreen';
import FAQsScreen from '../screens/FAQsScreen';
import ContactSupportScreen from '../screens/ContactSupportScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AuditLogsScreen from '../screens/AuditLogsScreen';
import AdminPaymentsScreen from '../screens/AdminPaymentsScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import LocationSearchScreen from '../screens/LocationSearchScreen';
import LiveWalkTrackingScreen from '../screens/LiveWalkTrackingScreen';
import SOSScreen from '../screens/SOSScreen';
import FamilyDashboardScreen from '../screens/FamilyDashboardScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentHelpScreen from '../screens/PaymentHelpScreen';

const Stack = createStackNavigator();

const AuthNavigator: React.FC = () => {
  const { user, userData, loading } = useAuth();
  const [permsReady, setPermsReady] = React.useState(false);
  const [needsPermissions, setNeedsPermissions] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const done = await AsyncStorage.getItem('hasCompletedPermissions');
        if (mounted) {
          setNeedsPermissions(done !== 'true');
        }
      } catch (e) {
        if (mounted) {
          setNeedsPermissions(true);
        }
      } finally {
        if (mounted) setPermsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !permsReady) {
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
    initialRouteName = 'RequestWalk';
  }

  return (
    <Stack.Navigator
      initialRouteName={needsPermissions ? 'Permissions' : initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Permissions"
        component={PermissionsScreen}
        initialParams={{ redirectTo: initialRouteName }}
      />
      <Stack.Screen name="RequestWalk" component={RequestWalkScreen} />
      <Stack.Screen name="RouteWalk" component={WandererHomeScreen} />
      <Stack.Screen name="NearbyWalk" component={NearbyWalkScreen} />
      <Stack.Screen name="HelpingHand" component={HelpingHandScreen} />
      <Stack.Screen name="SuggestiveWalk" component={SuggestiveWalkScreen} />
      <Stack.Screen name="ExploringWalk" component={ExploringWalkScreen} />
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
      <Stack.Screen name="RequestAccepted" component={RequestAcceptedScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="RemovedUser" component={RemovedUserScreen} />
      <Stack.Screen name="RemovedUsers" component={RemovedUsersScreen} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="RoleChange" component={RoleChangeScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="PushNotifications" component={PushNotificationsScreen} />
      <Stack.Screen name="EmailNotifications" component={EmailNotificationsScreen} />
      <Stack.Screen name="LocationSharing" component={LocationSharingScreen} />
      <Stack.Screen name="ContactsSharing" component={ContactsSharingScreen} />
      <Stack.Screen name="DataUsage" component={DataUsageScreen} />
      <Stack.Screen name="WalkHistory" component={WalkHistoryScreen} />
      <Stack.Screen name="FAQs" component={FAQsScreen} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="LocationSearch" component={LocationSearchScreen} />
      <Stack.Screen name="LiveWalkTracking" component={LiveWalkTrackingScreen} />
      <Stack.Screen name="SOS" component={SOSScreen} />
      <Stack.Screen name="FamilyDashboard" component={FamilyDashboardScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentHelp" component={PaymentHelpScreen} />
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