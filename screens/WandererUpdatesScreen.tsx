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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type WandererUpdatesScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkRequest {
  id: string;
  wandererId: string;
  wandererName: string;
  wandererImage?: string;
  walkerId: string;
  walkerName: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  pickup: string;
  destination: string;
  scheduledDate: string;
  scheduledTime: string;
  preference?: string;
  createdAt: any;
  acceptedAt?: any;
}

const WandererUpdatesScreen: React.FC<WandererUpdatesScreenProps> = ({ navigation }) => {
  const [requests, setRequests] = useState<WalkRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch accepted walk requests for this walker
    const requestsRef = collection(db, 'walkRequests');
    const requestsQuery = query(
      requestsRef,
      where('walkerId', '==', user.uid),
      where('status', '==', 'accepted')
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const requestsList: WalkRequest[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as WalkRequest));
          setRequests(requestsList);
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

              {/* Contact Section */}
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
                <MaterialIcons name="phone" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Call Wanderer</Text>
              </TouchableOpacity>
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
});

export default WandererUpdatesScreen;
