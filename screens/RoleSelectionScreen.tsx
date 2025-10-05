import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RoleSelectionScreenProps = {
  navigation: StackNavigationProp<any>;
};

const { width } = Dimensions.get('window');

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState<'walker' | 'wanderer' | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Select your role</Text>
        <Text style={styles.subtitle}>
          Select the role you would like to opt for in MoveMates :
        </Text>

        <View style={styles.rolesContainer}>
          {/* Walker Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.walkerCard,
              selectedRole === 'walker' && styles.roleCardPressed,
              selectedRole === 'walker' && styles.walkerCardSelected, // Add this line
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

          {/* Wanderer Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.wandererCard,
              selectedRole === 'wanderer' && styles.roleCardPressed,
              selectedRole === 'wanderer' && styles.wandererCardSelected, // Add this line
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
        </View>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('GetStarted')}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
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
    height: 200, // Add fixed height
    width: '100%', // Add fixed width
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
});

export default RoleSelectionScreen;
