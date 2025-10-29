import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type WalkerUpdatesScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkRequest {
  id: string;
  walkerId: string;
  walkerName: string;
  walkerImage?: string;
  walkerPhone?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'in_progress';
  pickup: string;
  destination: string;
  scheduledDate: string;
  scheduledTime: string;
  preference?: string;
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
}

const WalkerUpdatesScreen: React.FC<WalkerUpdatesScreenProps> = ({ navigation }) => {
  const [requests, setRequests] = useState<WalkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedWalkerId, setSelectedWalkerId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch walk requests for this wanderer (accepted, in_progress, completed)
    const requestsRef = collection(db, 'walkRequests');
    const requestsQuery = query(
      requestsRef,
      where('wandererId', '==', user.uid),
      where('status', 'in', ['accepted', 'in_progress'])
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const requestsList: WalkRequest[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as WalkRequest));
          console.log('Walker Updates - Received requests:', requestsList);
          requestsList.forEach(req => {
            console.log(`Request ${req.id} - walkerImage:`, req.walkerImage);
          });
          
          // Filter out past walks and sort by scheduled date/time (earliest first)
          const now = new Date();
          console.log('Current time:', now);
          
          const upcomingWalks = requestsList.filter((request) => {
            console.log('\n--- Filtering walk ---');
            console.log('Date:', request.scheduledDate, 'Time:', request.scheduledTime);
            const scheduledDateTime = parseDateTime(request.scheduledDate, request.scheduledTime);
            
            // Always show in-progress walks regardless of schedule time
            if (request.status === 'in_progress') {
              return true;
            }

            // Show completed walks only if completed today and have a valid timestamp
            if (request.status === 'completed') {
              if (!request.completedAt) return false;
              const raw = request.completedAt?.toDate?.() ?? new Date(request.completedAt);
              if (!(raw instanceof Date) || isNaN(raw.getTime())) return false;
              const today = new Date();
              return raw.toDateString() === today.toDateString();
            }

            if (!scheduledDateTime) {
              console.log('❌ Could not parse date, EXCLUDING walk');
              return false; // Exclude if date parsing fails to be safe
            }
            
            console.log('Scheduled:', scheduledDateTime);
            console.log('Now:', now);
            // Add 5-minute grace period to account for clock drift
            const isPast = scheduledDateTime.getTime() < (now.getTime() - 5 * 60 * 1000);
            console.log('Is past?', isPast, isPast ? '❌ EXCLUDING' : '✅ KEEPING');
            return !isPast; // Keep only future walks
          }).sort((a, b) => {
            const dateA = parseDateTime(a.scheduledDate, a.scheduledTime);
            const dateB = parseDateTime(b.scheduledDate, b.scheduledTime);
            
            // If either date is invalid, don't sort
            if (!dateA || !dateB) {
              return 0;
            }
            
            const diff = dateA.getTime() - dateB.getTime();
            console.log(`Sorting: ${a.scheduledDate} ${a.scheduledTime} vs ${b.scheduledDate} ${b.scheduledTime} = ${diff}`);
            return diff; // Ascending order (earliest first)
          });
          
          setRequests(upcomingWalks);
        } else {
          setRequests([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching walk requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper function to parse date/time more reliably
  const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
    try {
      console.log('Parsing:', dateStr, timeStr);
      
      // Parse date components
      const dateParts = dateStr.split(/[/-]/);
      const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      
      if (dateParts.length !== 3 || !timeParts) {
        console.error('Invalid date/time format');
        return null;
      }
      
      // Parse time
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const isPM = timeParts[3]?.toUpperCase() === 'PM';
      const isAM = timeParts[3]?.toUpperCase() === 'AM';
      
      // Convert to 24-hour format
      if (isPM && hours !== 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      
      // Determine date format based on first part
      let year: number, month: number, day: number;
      
      if (dateParts[0].length === 4) {
        // Format: YYYY-MM-DD or YYYY-DD-MM
        year = parseInt(dateParts[0]);
        month = parseInt(dateParts[1]);
        day = parseInt(dateParts[2]);
      } else if (dateParts[2].length === 4) {
        // Format: MM-DD-YYYY or DD-MM-YYYY
        year = parseInt(dateParts[2]);
        month = parseInt(dateParts[0]);
        day = parseInt(dateParts[1]);
      } else {
        console.error('Could not determine date format');
        return null;
      }
      
      // Create date (month is 0-indexed in JavaScript Date)
      const parsedDate = new Date(year, month - 1, day, hours, minutes);
      
      // Validate the date
      if (isNaN(parsedDate.getTime())) {
        console.error('Invalid date created');
        return null;
      }
      
      console.log('Successfully parsed to:', parsedDate);
      return parsedDate;
    } catch (error) {
      console.error('Error in parseDateTime:', error);
      return null;
    }
  };

  const handleChatWithWalker = async (walkerId: string, walkerName: string, walkerImage?: string) => {
    navigation.navigate('Chat', {
      userId: walkerId,
      userName: walkerName,
      userImage: walkerImage,
    });
  };

  const handleCallWalker = async (walkerId: string, walkerName: string) => {
    try {
      // Fetch walker's phone number from database
      const walkerDoc = await getDoc(doc(db, 'users', walkerId));
      
      if (!walkerDoc.exists()) {
        Alert.alert('Error', 'Walker information not found');
        return;
      }

      const walkerData = walkerDoc.data();
      const phoneNumber = walkerData?.phoneNumber || walkerData?.phone;

      if (!phoneNumber) {
        Alert.alert('Phone Number Not Available', `${walkerName} has not added their phone number yet.`);
        return;
      }

      // Open phone dialer
      const phoneUrl = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to make phone calls on this device');
      }
    } catch (error) {
      console.error('Error calling walker:', error);
      Alert.alert('Error', 'Failed to initiate call. Please try again.');
    }
  };

  // Check if cancel button should be shown (60 minutes before scheduled time)
  const canCancelWalk = (scheduledDate: string, scheduledTime: string): boolean => {
    try {
      const dateTimeString = `${scheduledDate} ${scheduledTime}`;
      console.log('Checking cancel eligibility for:', dateTimeString);
      
      const scheduledDateTime = parseDateTime(scheduledDate, scheduledTime);
      
      if (!scheduledDateTime) {
        console.log('Could not parse date, showing button');
        return true; // Show button if we can't parse the date
      }
      
      const now = new Date();
      const timeDiff = scheduledDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      console.log('Minutes until walk:', minutesDiff);
      console.log('Can cancel:', minutesDiff > 60);
      
      return minutesDiff > 60;
    } catch (error) {
      console.error('Error checking cancel eligibility:', error);
      return true;
    }
  };

  const handleCancelPress = (requestId: string, walkerId: string) => {
    setSelectedRequestId(requestId);
    setSelectedWalkerId(walkerId);
    setShowCancelModal(true);
  };

  const sendNotification = async (userId: string, title: string, message: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleCancelWalk = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for cancellation.');
      return;
    }

    if (!selectedRequestId || !selectedWalkerId) return;

    try {
      const requestRef = doc(db, 'walkRequests', selectedRequestId);
      await updateDoc(requestRef, {
        status: 'cancelled',
        cancelReason: cancelReason.trim(),
        cancelledAt: new Date(),
        cancelledBy: 'wanderer',
      });

      // Send notification to walker
      await sendNotification(
        selectedWalkerId,
        'Walk Cancelled',
        `A wanderer has cancelled the scheduled walk. Reason: ${cancelReason.trim()}`
      );

      Alert.alert('Walk Cancelled', 'The walk has been cancelled successfully.');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedRequestId(null);
      setSelectedWalkerId(null);
    } catch (error) {
      console.error('Error cancelling walk:', error);
      Alert.alert('Error', 'Failed to cancel the walk. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Walker Updates</Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading updates...</Text>
          </View>
        ) : requests.length > 0 ? (
          requests.map((request) => (
            <View key={request.id} style={styles.updateContainer}>
              {/* Acceptance Card */}
              <View style={styles.acceptanceCard}>
                <View style={styles.walkerInfoHeader}>
                  {request.walkerImage ? (
                    <Image 
                      source={{ uri: request.walkerImage }} 
                      style={styles.walkerAvatar} 
                    />
                  ) : (
                    <View style={styles.walkerAvatarPlaceholder}>
                      <MaterialIcons name="person" size={30} color="#CCCCCC" />
                    </View>
                  )}
                  <View style={styles.walkerTextInfo}>
                    <Text style={styles.acceptanceText}>
                      Walker {request.walkerName} accepted your request!
                    </Text>
                    <Text style={styles.acceptanceSubtext}>
                      Pickup: {request.pickup}
                    </Text>
                    <Text style={styles.acceptanceSubtext}>
                      Destination: {request.destination}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Meeting Info */}
              <View style={styles.meetingInfoCard}>
                <MaterialIcons name="event" size={24} color="#5B21B6" />
                <View style={styles.meetingTextContainer}>
                  <Text style={styles.meetingInfoTitle}>Scheduled Walk</Text>
                  <Text style={styles.meetingInfo}>
                    {request.scheduledDate} at {request.scheduledTime}
                  </Text>
                  {request.preference && (
                    <Text style={styles.preferenceText}>
                      Preference: {request.preference}
                    </Text>
                  )}
                </View>
              </View>

              {/* Track Walk Button - Show when walk is in progress */}
              {request.status === 'in_progress' ? (
                <TouchableOpacity
                  style={styles.trackWalkButton}
                  onPress={() => navigation.navigate('LiveWalkTracking', {
                    requestId: request.id,
                    wandererName: request.walkerName,
                    wandererPhone: request.walkerPhone,
                    isWandererView: true,
                  })}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="my-location" size={22} color="#FFFFFF" />
                  <Text style={styles.trackWalkButtonText}>Track Walk</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {/* Contact Section */}
                  <Text style={styles.contactTitle}>Need to contact the walker?</Text>

                  {/* Chat Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleChatWithWalker(request.walkerId, request.walkerName, request.walkerImage)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="chat" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Chat with Walker</Text>
                  </TouchableOpacity>

                  {/* Call Button */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => handleCallWalker(request.walkerId, request.walkerName)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="phone" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Call Walker</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Cancel Walk Button - Only show if more than 60 minutes remaining and not in progress */}
              {request.status !== 'in_progress' && canCancelWalk(request.scheduledDate, request.scheduledTime) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelPress(request.id, request.walkerId)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="cancel" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Cancel Walk</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noUpdatesContainer}>
            <MaterialIcons name="update" size={60} color="#CCCCCC" />
            <Text style={styles.noUpdatesText}>No updates yet</Text>
            <Text style={styles.noUpdatesSubtext}>
              You'll see updates here when a walker accepts your request
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Walk</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for cancelling this walk:
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Enter cancellation reason..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedRequestId(null);
                  setSelectedWalkerId(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCancelWalk}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
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
    paddingBottom: 30,
  },
  closeButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  updateContainer: {
    marginBottom: 30,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  acceptanceCard: {
    backgroundColor: '#E8F0FE',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  walkerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walkerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  walkerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  walkerTextInfo: {
    flex: 1,
  },
  acceptanceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  acceptanceSubtext: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  meetingInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  meetingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  meetingInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 4,
  },
  meetingInfo: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 4,
  },
  preferenceText: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  callButton: {
    backgroundColor: '#22C55E',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  noUpdatesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    minHeight: 500,
  },
  noUpdatesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 20,
    textAlign: 'center',
  },
  noUpdatesSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#000000',
    minHeight: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalConfirmButton: {
    backgroundColor: '#EF4444',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackWalkButton: {
    flexDirection: 'row',
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 10,
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  trackWalkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default WalkerUpdatesScreen;
