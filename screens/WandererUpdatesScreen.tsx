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
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type WandererUpdatesScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkRequest {
  id: string;
  wandererId: string;
  wandererName: string;
  wandererImage?: string;
  wandererPhone?: string;
  walkerId: string;
  walkerName: string;
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

const WandererUpdatesScreen: React.FC<WandererUpdatesScreenProps> = ({ navigation }) => {
  const [requests, setRequests] = useState<WalkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedWandererId, setSelectedWandererId] = useState<string | null>(null);
  const [showStartWalkModal, setShowStartWalkModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WalkRequest | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch accepted, in_progress, and completed walk requests for this walker
    const requestsRef = collection(db, 'walkRequests');
    const requestsQuery = query(
      requestsRef,
      where('walkerId', '==', user.uid),
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
          
          // Filter out past walks and sort by scheduled date/time (earliest first)
          const now = new Date();
          console.log('Current time:', now);
          
          const upcomingWalks = requestsList.filter((request) => {
            console.log('\n--- Filtering walk ---');
            // Always show in_progress walks
            if (request.status === 'in_progress') {
              return true;
            }

            // Show completed walks from today
            if (request.status === 'completed') {
              // Ensure a valid completedAt exists
              if (!request.completedAt) {
                return false;
              }
              const raw = request.completedAt?.toDate?.() ?? new Date(request.completedAt);
              if (!(raw instanceof Date) || isNaN(raw.getTime())) {
                return false;
              }
              const today = new Date();
              const isToday = raw.toDateString() === today.toDateString();
              return isToday;
            }

            const scheduledDateTime = parseDateTime(request.scheduledDate, request.scheduledTime);
            if (!scheduledDateTime) {
              console.log('Invalid date/time for request:', request.id);
              return false; // Exclude if we can't parse the date
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
        console.error('Error fetching accepted walk requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleChatWithWanderer = async (wandererId: string, wandererName: string, wandererImage?: string) => {
    navigation.navigate('Chat', {
      userId: wandererId,
      userName: wandererName,
      userImage: wandererImage,
    });
  };

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

  const handleCallWanderer = async (wandererId: string, wandererName: string) => {
    try {
      // Fetch wanderer's phone number from database
      const wandererDoc = await getDoc(doc(db, 'users', wandererId));
      
      if (!wandererDoc.exists()) {
        Alert.alert('Error', 'Wanderer information not found');
        return;
      }

      const wandererData = wandererDoc.data();
      const phoneNumber = wandererData?.phoneNumber || wandererData?.phone;

      if (!phoneNumber) {
        Alert.alert('Phone Number Not Available', `${wandererName} has not added their phone number yet.`);
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
      console.error('Error calling wanderer:', error);
      Alert.alert('Error', 'Failed to initiate call. Please try again.');
    }
  };

  // Check if reject button should be shown (60 minutes before scheduled time)
  const canRejectWalk = (scheduledDate: string, scheduledTime: string): boolean => {
    try {
      const dateTimeString = `${scheduledDate} ${scheduledTime}`;
      console.log('Checking reject eligibility for:', dateTimeString);
      
      const scheduledDateTime = parseDateTime(scheduledDate, scheduledTime);
      
      if (!scheduledDateTime) {
        console.log('Could not parse date, showing button');
        return true; // Show button if we can't parse the date
      }
      
      const now = new Date();
      const timeDiff = scheduledDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      console.log('Minutes until walk:', minutesDiff);
      console.log('Can reject:', minutesDiff > 60);
      
      return minutesDiff > 60; // Can reject if more than 60 minutes remaining
    } catch (error) {
      console.error('Error checking reject eligibility:', error);
      return true; // Show button on error to be safe
    }
  };

  // Check if start walk button should be shown (15 minutes before scheduled time)
  const canStartWalk = (scheduledDate: string, scheduledTime: string): boolean => {
    try {
      const scheduledDateTime = parseDateTime(scheduledDate, scheduledTime);
      
      if (!scheduledDateTime) {
        return false; // Don't show button if we can't parse the date
      }
      
      const now = new Date();
      const timeDiff = scheduledDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Show button if 15 minutes or less before scheduled time, but not after
      return minutesDiff <= 15 && minutesDiff > -60; // Show from 15 min before until 60 min after
    } catch (error) {
      console.error('Error checking start walk eligibility:', error);
      return false;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleStartWalk = async (request: WalkRequest) => {
    setCheckingLocation(true);
    
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to start the walk. We need to verify you are at the pickup location.',
          [{ text: 'OK' }]
        );
        setCheckingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('Walker location:', location.coords);
      console.log('Pickup location:', request.pickup);

      // Geocode the pickup address to get coordinates
      try {
        const geocodedLocation = await Location.geocodeAsync(request.pickup);
        
        if (geocodedLocation && geocodedLocation.length > 0) {
          const pickupCoords = geocodedLocation[0];
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            pickupCoords.latitude,
            pickupCoords.longitude
          );

          console.log('Distance to pickup:', distance, 'meters');

          // Check if walker is within 300 meters of pickup location
          const REQUIRED_DISTANCE = 300; // meters
          
          if (distance > REQUIRED_DISTANCE) {
            Alert.alert(
              'Too Far from Pickup Location',
              `You are ${Math.round(distance)} meters away from the pickup location. Please move closer (within ${REQUIRED_DISTANCE}m) to start the walk.\n\nPickup: ${request.pickup}`,
              [{ text: 'OK' }]
            );
            setCheckingLocation(false);
            return;
          }

          // Walker is close enough, proceed
          console.log('Walker is within range, allowing start');
        } else {
          // Could not geocode address, show warning but allow to proceed
          Alert.alert(
            'Location Verification',
            'Could not verify pickup location. Please ensure you are at:\n\n' + request.pickup,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => { setCheckingLocation(false); } },
              { text: 'I am at pickup', onPress: () => {
                setSelectedRequest(request);
                setShowStartWalkModal(true);
              }}
            ]
          );
          setCheckingLocation(false);
          return;
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Geocoding failed, show warning but allow to proceed
        Alert.alert(
          'Location Verification',
          'Could not verify pickup location. Please ensure you are at:\n\n' + request.pickup,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => { setCheckingLocation(false); } },
            { text: 'I am at pickup', onPress: () => {
              setSelectedRequest(request);
              setShowStartWalkModal(true);
            }}
          ]
        );
        setCheckingLocation(false);
        return;
      }
      
      setSelectedRequest(request);
      setShowStartWalkModal(true);
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please ensure GPS is enabled and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCheckingLocation(false);
    }
  };

  const confirmStartWalk = async () => {
    if (!selectedRequest) return;
    
    setShowStartWalkModal(false);
    try {
      // Update status to in_progress
      const requestRef = doc(db, 'walkRequests', selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'in_progress',
        startedAt: new Date(),
      });

      // Navigate to live walk tracking screen
      navigation.navigate('LiveWalkTracking', {
        requestId: selectedRequest.id,
        wandererName: selectedRequest.wandererName,
        wandererPhone: selectedRequest.wandererPhone,
      });
    } catch (error) {
      console.error('Error starting walk:', error);
      Alert.alert('Error', 'Failed to start the walk. Please try again.');
    }
  };

  const handleViewLiveTracking = (request: WalkRequest) => {
    navigation.navigate('LiveWalkTracking', {
      requestId: request.id,
      wandererName: request.wandererName,
      wandererPhone: request.wandererPhone,
    });
  };

  const handleRejectPress = (requestId: string, wandererId: string) => {
    setSelectedRequestId(requestId);
    setSelectedWandererId(wandererId);
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

    if (!selectedRequestId || !selectedWandererId) return;

    try {
      const requestRef = doc(db, 'walkRequests', selectedRequestId);
      await updateDoc(requestRef, {
        status: 'cancelled',
        cancelReason: cancelReason.trim(),
        cancelledAt: new Date(),
        cancelledBy: 'walker',
      });

      // Send notification to wanderer
      await sendNotification(
        selectedWandererId,
        'Walk Rejected',
        `Your walker has rejected the scheduled walk. Reason: ${cancelReason.trim()}`
      );

      Alert.alert('Walk Cancelled', 'The walk has been cancelled successfully.');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedRequestId(null);
      setSelectedWandererId(null);
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
          <Text style={styles.headerTitle}>Wanderer Updates</Text>
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
                <View style={styles.wandererInfoHeader}>
                  {request.wandererImage ? (
                    <Image 
                      source={{ uri: request.wandererImage }} 
                      style={styles.wandererAvatar} 
                    />
                  ) : (
                    <View style={styles.wandererAvatarPlaceholder}>
                      <MaterialIcons name="person" size={30} color="#CCCCCC" />
                    </View>
                  )}
                  <View style={styles.wandererTextInfo}>
                    <Text style={styles.acceptanceText}>
                      You accepted {request.wandererName}'s request!
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

              {/* Walk Action Buttons */}
              {request.status === 'in_progress' ? (
                // Show Track Walk button when walk is in progress
                <TouchableOpacity
                  style={styles.startWalkButton}
                  onPress={() => handleViewLiveTracking(request)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="my-location" size={22} color="#FFFFFF" />
                  <Text style={styles.startWalkButtonText}>Track Walk</Text>
                </TouchableOpacity>
              ) : (
                // Show Start Walk button 15 minutes before scheduled time
                canStartWalk(request.scheduledDate, request.scheduledTime) && (
                  <TouchableOpacity
                    style={styles.startWalkButton}
                    onPress={() => handleStartWalk(request)}
                    activeOpacity={0.8}
                    disabled={checkingLocation}
                  >
                    {checkingLocation ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.startWalkButtonText}>Checking Location...</Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="directions-walk" size={22} color="#FFFFFF" />
                        <Text style={styles.startWalkButtonText}>Start Walk</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )
              )}

              {/* Contact Section - Hide when walk is in progress */}
              {request.status !== 'in_progress' && (
                <>
                  <Text style={styles.contactTitle}>Need to contact the wanderer?</Text>

                  {/* Chat Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleChatWithWanderer(request.wandererId, request.wandererName, request.wandererImage)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="chat" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Chat with Wanderer</Text>
                  </TouchableOpacity>

                  {/* Call Button */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => handleCallWanderer(request.wandererId, request.wandererName)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="call" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Call Wanderer</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Reject Button - Only show if more than 60 minutes remaining and walk not in progress */}
              {request.status !== 'in_progress' && canRejectWalk(request.scheduledDate, request.scheduledTime) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectPress(request.id, request.wandererId)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="cancel" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Reject Walk</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noUpdatesContainer}>
            <MaterialIcons name="update" size={60} color="#CCCCCC" />
            <Text style={styles.noUpdatesText}>No accepted requests yet</Text>
            <Text style={styles.noUpdatesSubtext}>
              You'll see updates here when you accept a wanderer's request
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
                  setSelectedWandererId(null);
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

      {/* Start Walk Confirmation Modal */}
      <Modal
        visible={showStartWalkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartWalkModal(false)}
      >
        <View style={styles.startWalkModalOverlay}>
          <View style={styles.startWalkModalContent}>
            <View style={styles.startWalkIconContainer}>
              <MaterialIcons name="directions-walk" size={64} color="#22C55E" />
            </View>
            
            <Text style={styles.startWalkModalTitle}>Start Walk?</Text>
            <Text style={styles.startWalkModalMessage}>
              Are you ready to start the walk with {selectedRequest?.wandererName}?
            </Text>

            <View style={styles.startWalkModalButtons}>
              <TouchableOpacity
                style={styles.startWalkCancelButton}
                onPress={() => setShowStartWalkModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.startWalkCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.startWalkConfirmButton}
                onPress={confirmStartWalk}
                activeOpacity={0.8}
              >
                <Text style={styles.startWalkConfirmButtonText}>Start Walk</Text>
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
  wandererInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wandererAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  wandererAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  wandererTextInfo: {
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
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  preferenceText: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
  },
  startWalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 10,
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  startWalkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  rejectButton: {
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
  startWalkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startWalkModalContent: {
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
  startWalkIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  startWalkModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  startWalkModalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startWalkModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  startWalkCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  startWalkCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  startWalkConfirmButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startWalkConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WandererUpdatesScreen;
