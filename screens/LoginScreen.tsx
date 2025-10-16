import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView, Image, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'Login'>;
};

const { width } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { userData } = useAuth();
  const extra = (Constants?.expoConfig as any)?.extra?.googleOAuth || {};
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: extra.webClientId,
    iosClientId: extra.iosClientId,
    androidClientId: extra.androidClientId,
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const idToken = (response.params as any)?.id_token;
        if (idToken) {
          const res = await authService.signInWithGoogleCredential(idToken);
          if (!res.success) {
            Alert.alert('Error', res.error || 'Failed to login with Google');
          }
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    const result = await authService.signIn(email, password);
    setIsLoading(false);

    if (result.success) {
      // Navigation will be handled by the AuthProvider
      // based on userData.role and userData.approved
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <Text style={styles.title}>Login to your account</Text>
        <Text style={styles.subtitle}>Enter your credentials to access you account</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email :</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Password :</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={() => {
          if (!extra?.webClientId) {
            Alert.alert('Google Sign-In not configured', 'Please set googleOAuth client IDs in app.json');
            return;
          }
          if (!request) {
            Alert.alert('Please wait', 'Google sign-in is initializing. Try again in a second.');
            return;
          }
          promptAsync({ useProxy: true });
        }}>
          <Image 
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Login using Google</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>Create new account</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#D9D9D9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 24,
    color: '#000000',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  passwordInput: {
    backgroundColor: '#D9D9D9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#000000',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 20,
    top: 16,
    padding: 0,
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  dividerContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  divider: {
    width: width - 100,
    height: 1,
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 8,
  },
  signupLink: {
    fontSize: 15,
    color: '#4285F4',
    fontWeight: '600',
  },
});

export default LoginScreen;