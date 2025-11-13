import React, { useState, useEffect, useRef } from 'react';
import { View, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import MapLibreGL from '@maplibre/maplibre-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import AuthNavigator from './components/AuthNavigator';

// Import all your existing screens
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import ProfileDetailsScreen from './screens/ProfileDetailsScreen';
import GetStartedScreen from './screens/GetStartedScreen';
import ProfileScreen from './screens/ProfileScreen';
import HelpPolicyScreen from './screens/HelpPolicyScreen';
import WalkerTestScreen from './screens/WalkerTestScreen';
import { db, auth } from './firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const isMapLibreAvailable =
  MapLibreGL &&
  typeof MapLibreGL.setAccessToken === 'function' &&
  typeof MapLibreGL.setConnected === 'function';

if (isMapLibreAvailable) {
  MapLibreGL.setAccessToken(null).catch((error) =>
    console.warn('MapLibreGL.setAccessToken failed', error)
  );
  try {
    MapLibreGL.setConnected(true);
  } catch (error) {
    console.warn('MapLibreGL.setConnected failed', error);
  }
} else {
  console.warn(
    'MapLibre native module is unavailable. Maps will not render in this environment (Expo Go).'
  );
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  Permissions: {
    selectedRole?: 'walker' | 'wanderer';
    isExistingUser?: boolean;
  } | undefined;
  RoleSelection: {
    userData?: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email: string;
      password: string;
    };
    isExistingUser?: boolean;
  } | undefined;
  ProfileDetails: {
    userData: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email: string;
      password: string;
    };
    selectedRole: 'walker' | 'wanderer';
  };
  WalkerTest: {
    userData: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email: string;
      password: string;
    };
    selectedRole: 'walker';
  };
  GetStarted: undefined;
  AuthNavigator: undefined;
  Profile: undefined;
  HelpPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function NotificationListener() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const lastNotificationId = useRef("");
  useEffect(() => {
    if (!user) return;
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const sorted = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .sort((a, b) => (b.timestamp?.toDate?.()?.getTime?.() || 0)-(a.timestamp?.toDate?.()?.getTime?.() || 0));
      if (sorted.length) {
        const notif = sorted[0];
        if (notif && notif.id !== lastNotificationId.current) {
          lastNotificationId.current = notif.id;
          showToast(notif.title || 'New Notification', { body: notif.body || notif.message || '' });
        }
      }
    });
    return () => unsubscribe();
  }, [user, showToast]);
  return null;
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        setIsFirstLaunch(hasSeenOnboarding !== 'true');
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(true);
      }
    };
    
    checkFirstLaunch();
  }, []);

  if (loading || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
        initialRouteName={!user ? (isFirstLaunch ? 'Splash' : 'Login') : 'AuthNavigator'}
      >
        {!user ? (
          // Not authenticated - show auth screens
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Permissions" component={PermissionsScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
            <Stack.Screen name="WalkerTest" component={WalkerTestScreen} />
            <Stack.Screen name="GetStarted" component={GetStartedScreen} />
          </>
        ) : (
          // Authenticated - show role-based screens
          <>
            <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationListener />
            <SafeAreaProvider>
              <AppNavigator />
            </SafeAreaProvider>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}