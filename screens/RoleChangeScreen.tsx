import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type RoleChangeScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RoleChangeScreen: React.FC<RoleChangeScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const [selectedRole, setSelectedRole] = useState(userData?.role || 'wanderer');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async () => {
    if (!userData?.uid) return;

    if (selectedRole === userData.role) {
      Alert.alert('No Change', 'You have selected the same role.');
      return;
    }

    Alert.alert(
      'Confirm Role Change',
      `Are you sure you want to change your role to ${selectedRole === 'walker' ? 'Walker' : 'Wanderer'}? ${
        selectedRole === 'walker' ? 'Your account will need admin approval.' : ''
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              const userRef = doc(db, 'users', userData.uid);
              const updateData: any = {
                role: selectedRole,
              };

              // If changing to walker, set approved to false
              if (selectedRole === 'walker') {
                updateData.approved = false;
              }

              await updateDoc(userRef, updateData);

              Alert.alert(
                'Success',
                `Your role has been changed to ${selectedRole === 'walker' ? 'Walker' : 'Wanderer'}.${
                  selectedRole === 'walker' ? ' Please wait for admin approval.' : ''
                }`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error changing role:', error);
              Alert.alert('Error', 'Failed to change role. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Role Change</Text>
        </View>

        {/* Current Role */}
        <View style={styles.currentRoleCard}>
          <Text style={styles.currentRoleLabel}>Current Role</Text>
          <Text style={styles.currentRoleValue}>
            {userData?.role === 'walker' ? 'Walker' : userData?.role === 'wanderer' ? 'Wanderer' : 'Admin'}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Select the role you want to switch to. Note that changing to Walker requires admin approval.
        </Text>

        {/* Role Options */}
        <View style={styles.roleOptions}>
          {/* Wanderer Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.wandererCard,
              selectedRole === 'wanderer' && styles.selectedCard,
            ]}
            onPress={() => setSelectedRole('wanderer')}
            activeOpacity={0.7}
            disabled={userData?.role === 'admin'}
          >
            <View style={styles.roleIconContainer}>
              <MaterialIcons name="directions-walk" size={40} color="#5B21B6" />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Wanderer</Text>
              <Text style={styles.roleDescription}>
                Request walks and get assistance from walkers
              </Text>
            </View>
            {selectedRole === 'wanderer' && (
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>

          {/* Walker Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.walkerCard,
              selectedRole === 'walker' && styles.selectedCard,
            ]}
            onPress={() => setSelectedRole('walker')}
            activeOpacity={0.7}
            disabled={userData?.role === 'admin'}
          >
            <View style={styles.roleIconContainer}>
              <MaterialIcons name="accessibility-new" size={40} color="#059669" />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Walker</Text>
              <Text style={styles.roleDescription}>
                Help wanderers by accepting walk requests
              </Text>
              <Text style={styles.approvalNote}>Requires admin approval</Text>
            </View>
            {selectedRole === 'walker' && (
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        </View>

        {/* Admin Notice */}
        {userData?.role === 'admin' && (
          <View style={styles.adminNotice}>
            <MaterialIcons name="info" size={20} color="#FF9800" />
            <Text style={styles.adminNoticeText}>
              Admin accounts cannot change roles
            </Text>
          </View>
        )}

        {/* Change Role Button */}
        {userData?.role !== 'admin' && (
          <TouchableOpacity
            style={[styles.changeButton, loading && styles.disabledButton]}
            onPress={handleRoleChange}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.changeButtonText}>
              {loading ? 'Changing Role...' : 'Change Role'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  currentRoleCard: {
    backgroundColor: '#F7EDD9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  currentRoleLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  currentRoleValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 25,
    lineHeight: 20,
  },
  roleOptions: {
    marginBottom: 30,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wandererCard: {
    backgroundColor: '#F3E8FF',
  },
  walkerCard: {
    backgroundColor: '#D1FAE5',
  },
  selectedCard: {
    borderColor: '#4CAF50',
  },
  roleIconContainer: {
    marginRight: 15,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  approvalNote: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 5,
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  adminNoticeText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 10,
    flex: 1,
  },
  changeButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RoleChangeScreen;
