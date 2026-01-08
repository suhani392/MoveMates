import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { authService } from '../services/authService';
import { RootStackParamList } from '../App';

type RoleSelectionScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'RoleSelection'>;
  route: RouteProp<RootStackParamList, 'RoleSelection'>;
};

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation, route }) => {
  const [selectedRole, setSelectedRole] = useState<'walker' | 'wanderer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    const userData = route?.params?.userData;
    const isExistingUser = route?.params?.isExistingUser;

    if (isExistingUser) {
      // For existing users, go to permissions then login
      navigation.navigate('Permissions', { selectedRole, isExistingUser: true });
    } else if (userData) {
      // For new users, navigate to profile details screen
      navigation.navigate('ProfileDetails', { userData, selectedRole });
    } else {
      // Navigate to permissions for new users
      navigation.navigate('Permissions', { selectedRole });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select the role you would like to opt for in MoveMates :
        </Text>

        <View style={styles.rolesContainer}>
          {/* Wanderer Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.wandererCard,
              selectedRole === 'wanderer' && styles.roleCardPressed,
              selectedRole === 'wanderer' && styles.wandererCardSelected,
            ]}
            onPress={() => setSelectedRole('wanderer')}
            activeOpacity={1}
          >
            <View style={styles.roleContent}>
              <View style={styles.roleLeft}>
                <Text style={styles.roleTitle}>Wanderer</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.roleRight}>
                <Text style={styles.roleDescription}>
                  Looking for a safe and friendly walking companion. Find verified walkers, schedule walks, and enjoy social, purposeful walking.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Walker Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.walkerCard,
              selectedRole === 'walker' && styles.roleCardPressed,
              selectedRole === 'walker' && styles.walkerCardSelected,
            ]}
            onPress={() => setSelectedRole('walker')}
            activeOpacity={1}
          >
            <View style={styles.roleContent}>
              <View style={styles.roleLeft}>
                <Text style={styles.roleTitle}>Walker</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.roleRight}>
                <Text style={styles.roleDescription}>
                  Join as a trusted walking partner. Set your availability, accept requests, earn from walks, and help others walk safely.
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.getStartedButton, (!selectedRole || isLoading) && styles.getStartedButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedRole || isLoading}
        >
          <Text style={[styles.getStartedButtonText, (!selectedRole || isLoading) && styles.getStartedButtonTextDisabled]}>
            {isLoading ? 'Creating Account...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 40,
    lineHeight: 24,
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 40,
  },
  roleCard: {
    borderRadius: 25,
    marginBottom: 24,
    borderWidth: 0,
    height: 200,
    width: '100%',
  },
  walkerCard: {
    backgroundColor: '#E8F6E9',
  },
  wandererCard: {
    backgroundColor: '#D9DFF7',
  },
  roleCardPressed: {
    transform: [{ translateY: 6 }],
  },
  walkerCardSelected: {
    borderWidth: 3,
    borderColor: '#B2F4B7',
  },
  wandererCardSelected: {
    borderWidth: 3,
    borderColor: '#9BAEF7',
  },
  roleContent: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
  },
  roleLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  divider: {
    width: 2,
    height: 150,
    backgroundColor: '#000000',
    marginLeft: 0,
    marginRight: 16,
  },
  roleRight: {
    flex: 1.5,
    justifyContent: 'center',
    paddingLeft: 15,
  },
  roleDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 19,
  },
  getStartedButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  getStartedButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  getStartedButtonTextDisabled: {
    color: '#999999',
  },
});

export default RoleSelectionScreen;