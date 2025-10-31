import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type RoleChangeScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RoleChangeScreen: React.FC<RoleChangeScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState(userData?.role || 'wanderer');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const showCustomAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
    // Store the confirm callback if provided
    if (onConfirm) {
      setOnConfirmCallback(() => onConfirm);
    } else {
      setOnConfirmCallback(null);
    }
  };

  const handleRoleChange = async () => {
    if (!userData?.uid) return;

    if (selectedRole === userData.role) {
      showCustomAlert(
        'Role Already Set',
        `You are already a ${selectedRole === 'walker' ? 'Walker' : 'Wanderer'}.`
      );
      return;
    }

    // If changing from wanderer to walker, send request to admin
    if (userData.role === 'wanderer' && selectedRole === 'walker') {
      showCustomAlert(
        'Confirm Role Change',
        `Are you sure you want to change your role to ${selectedRole}?`,
        handleConfirmRoleChange
      );
    } else {
      // For other role changes, show confirmation
      showCustomAlert(
        'Confirm Role Change',
        `Are you sure you want to change your role to ${selectedRole}?`,
        handleDirectRoleUpdate
      );
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!userData?.uid) return;
    
    setShowConfirmModal(false);
    setLoading(true);
    try {
      // Create role change request
      await addDoc(collection(db, 'role_change_requests'), {
        userId: userData.uid,
        userName: userData.name,
        userEmail: userData.email,
        currentRole: 'wanderer',
        requestedRole: 'walker',
        status: 'pending',
        requestedAt: serverTimestamp(),
      });

      Alert.alert(t('success'), t('requestSent'));
      navigation.goBack();
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert(t('error'), 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const renderAlertContent = () => (
    <View style={styles.alertContainer}>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>Role Already Set</Text>
        <Text style={styles.alertMessage}>
          You are already a {selectedRole === 'walker' ? 'Walker' : 'Wanderer'}.
        </Text>
        <TouchableOpacity
          style={styles.alertButton}
          onPress={() => {
            // Dismiss the alert
            Alert.alert('', '', { cancelable: true });
          }}
        >
          <Text style={styles.alertButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Custom Alert Modal Component
  const CustomAlert = () => (
    <Modal
      transparent={true}
      visible={showAlertModal}
      animationType="fade"
      onRequestClose={() => setShowAlertModal(false)}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertHeaderText}>{alertTitle}</Text>
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertMessageText}>{alertMessage}</Text>
          </View>
          <View style={styles.alertFooter}>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setShowAlertModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Handle role update directly (for non-walker role changes)
  const handleDirectRoleUpdate = async () => {
    if (!userData?.uid) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        role: selectedRole,
      });
      showCustomAlert('Success', 'Role changed successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error changing role:', error);
      showCustomAlert('Error', 'Failed to change role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert />
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

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Select the role you want to switch to. Note that changing to Walker requires admin approval.
          </Text>
        </View>

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
              <MaterialIcons name="check-circle" size={24} color="#22C55E" />
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
              <MaterialIcons name="check-circle" size={24} color="#22C55E" />
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
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.changeButtonText}>Change Role</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Custom Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <MaterialIcons name="info" size={48} color="#3B82F6" />
            </View>
            
            <Text style={styles.modalTitle}>{t('roleChangeRequest')}</Text>
            <Text style={styles.modalMessage}>
              Your request to become a Walker will be sent to the admin for approval. You will be notified once your request is reviewed.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmRoleChange}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>{t('requestRoleChange')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertHeader: {
    backgroundColor: '#5B21B6',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  alertHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alertBody: {
    padding: 25,
    alignItems: 'center',
  },
  alertMessageText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  alertButton: {
    backgroundColor: '#5B21B6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#374151',
  },
  // Alert Styles
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  alertContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    elevation: 2,
  },
  alertButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
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
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },
  infoText: {
    fontSize: 13,
    color: '#0369A1',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  wandererCard: {
    backgroundColor: '#D9DFF7',
  },
  walkerCard: {
    backgroundColor: '#E8F6E9',
  },
  selectedCard: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.2,
    elevation: 4,
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
    color: '#3B82F6',
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
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  adminNoticeText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  changeButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  modalCancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  modalConfirmButton: {
    backgroundColor: '#000000',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default RoleChangeScreen;
