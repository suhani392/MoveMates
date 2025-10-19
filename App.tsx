import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
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
  GetStarted: undefined;
  AuthNavigator: undefined;
  Profile: undefined;
  HelpPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}