import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { WalkRequestService } from '../services/walkRequestService';

const WandererDetailsScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const wanderer = route.params?.wanderer;
  const requestId = route.params?.requestId;
  
  console.log('=== WandererDetailsScreen Loaded ===');
  console.log('Wanderer object:', wanderer);
  console.log('Wanderer ID:', wanderer?.id);
  console.log('Request ID:', requestId);
  
  const [processing, setProcessing] = useState(false);
  const [wandererDetails, setWandererDetails] = useState<any>(null);
  const [walkRequest, setWalkRequest] = useState<any>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);


  // Fetch wanderer details and walk request
  useEffect(() => {
    const fetchDetails = async () => {
      if (!wanderer?.id || !requestId) return;

      try {
        // Fetch wanderer's full profile
        const wandererDoc = await getDoc(doc(db, 'users', wanderer.id));
        if (wandererDoc.exists()) {
          setWandererDetails(wandererDoc.data());
        }

        // Fetch walk request details
        const requestDoc = await getDoc(doc(db, 'walkRequests', requestId));
        if (requestDoc.exists()) {
          setWalkRequest(requestDoc.data());
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      }
    };

    fetchDetails();
  }, [wanderer?.id, requestId]);


  const handleAcceptRequest = async () => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    setProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Get walker name from user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const walkerName = userDoc.exists() ? userDoc.data()?.name || 'Walker' : 'Walker';

      await WalkRequestService.acceptRequest(requestId, wanderer.id, walkerName);
      
      // Update walker status to busy
      await updateDoc(doc(db, 'users', user.uid), {
        currentWalkStatus: 'busy',
      });

      // Navigate to the acceptance confirmation screen
      navigation.replace('RequestAccepted', {
        wandererName: wanderer.name,
        wandererId: wanderer.id,
        wandererImage: wanderer.image,
        scheduledTime: wanderer.scheduledTime,
        requestId: requestId,
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept the request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineRequest = () => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }
    setShowDeclineModal(true);
  };

  const confirmDeclineRequest = async () => {
    setShowDeclineModal(false);
    setProcessing(true);
    try {
      await WalkRequestService.declineRequest(requestId);
      // Navigate back without showing success alert
      navigation.goBack();
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline the request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!wanderer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Wanderer not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wanderer</Text>
        </View>

        {/* Wanderer Card */}
        <View style={styles.wandererCard}>
          {/* Wanderer Name with Verified Badge */}
          <View style={[styles.nameContainer, { marginTop: 20 }]}>
            <Text style={styles.wandererName}>{wanderer.name}</Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={18} color="#2196F3" />
              <Text style={styles.verifiedText}>verified</Text>
            </View>
          </View>

          {/* About Section */}
          {(wandererDetails?.about || wanderer.about) && (
            <View style={styles.aboutSection}>
              <Text style={styles.detailValue}>{wandererDetails?.about || wanderer.about}</Text>
            </View>
          )}

          {/* Personal Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pace</Text>
              <Text style={styles.detailValue}>{wandererDetails?.walkingPace || wanderer.pace || 'Moderate'}</Text>
            </View>
            {(wandererDetails?.languages || wanderer.languages) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Languages</Text>
                <Text style={styles.detailValue}>{wandererDetails?.languages || wanderer.languages}</Text>
              </View>
            )}
            {(wandererDetails?.age || wanderer.age) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{wandererDetails?.age || wanderer.age}</Text>
              </View>
            )}
            {(wandererDetails?.hobbies || wanderer.hobbies) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hobbies</Text>
                <Text style={styles.detailValue}>{wandererDetails?.hobbies || wanderer.hobbies}</Text>
              </View>
            )}
          </View>

          {/* Walk Details Section */}
          {walkRequest && (
            <View style={styles.walkDetailsSection}>
              <Text style={styles.sectionTitle}>Walk Details</Text>
              
              {/* Show different format based on walkType */}
              {walkRequest.walkType === 'route' || !walkRequest.walkType ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pickup</Text>
                    <Text style={styles.detailValue}>{walkRequest.pickup || wanderer.pickup || '---'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Destination</Text>
                    <Text style={styles.detailValue}>{walkRequest.destination || wanderer.destination || '---'}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{walkRequest.pickup || walkRequest.meetingPoint || '---'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{
                      walkRequest.walkType === 'nearby' ? 'Nearby Walk' :
                      walkRequest.walkType === 'exploringWalk' ? 'Exploring Walk' :
                      walkRequest.walkType === 'helpingHand' ? 'Helping Hand' :
                      walkRequest.walkType === 'suggestiveWalk' ? 'Suggestive Walk' :
                      walkRequest.walkType
                    }</Text>
                  </View>
                  {walkRequest.duration && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailValue}>{walkRequest.duration} minutes</Text>
                    </View>
                  )}
                </>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{walkRequest.scheduledDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{walkRequest.scheduledTime}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Preference</Text>
                <Text style={styles.detailValue}>{walkRequest.preference || wanderer.preference || 'Solo'}</Text>
              </View>
              {walkRequest.estimatedDuration && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Est. Duration</Text>
                  <Text style={styles.detailValue}>{walkRequest.estimatedDuration}</Text>
                </View>
              )}
            </View>
          )}

        </View>

        {/* Accept Request Button */}
        <TouchableOpacity
          style={[styles.acceptButton, processing && styles.buttonDisabled]}
          onPress={handleAcceptRequest}
          activeOpacity={0.8}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Request</Text>
          )}
        </TouchableOpacity>

        {/* Decline Request Button */}
        <TouchableOpacity
          style={[styles.declineButton, processing && styles.buttonDisabled]}
          onPress={handleDeclineRequest}
          activeOpacity={0.8}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FF0000" />
          ) : (
            <Text style={styles.declineButtonText}>Decline Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Decline Request Confirmation Modal */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View style={styles.declineModalOverlay}>
          <View style={styles.declineModalContent}>
            <View style={styles.declineIconContainer}>
              <MaterialIcons name="cancel" size={64} color="#EF4444" />
            </View>
            
            <Text style={styles.declineModalTitle}>Decline Request?</Text>
            <Text style={styles.declineModalMessage}>
              Are you sure you want to decline the walk request from {wanderer.name}?
            </Text>

            <View style={styles.declineModalButtons}>
              <TouchableOpacity
                style={styles.declineCancelButton}
                onPress={() => setShowDeclineModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.declineCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineConfirmButton}
                onPress={confirmDeclineRequest}
                activeOpacity={0.8}
              >
                <Text style={styles.declineConfirmButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backIconButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  wandererCard: {
    backgroundColor: '#E8F0FD',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
  },
  profileImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  wandererName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginRight: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '600',
  },
  aboutSection: {
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 20,
  },
  walkDetailsSection: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  declineButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF0000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  declineModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  declineModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  declineIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  declineModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  declineModalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  declineModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  declineCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  declineConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WandererDetailsScreen;
