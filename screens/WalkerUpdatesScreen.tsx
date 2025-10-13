import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type WalkerUpdatesScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkRequest {
  id: string;
  walkerId: string;
  walkerName: string;
  status: 'pending' | 'accepted' | 'declined';
  pickupPoint: string;
  meetingTime: string;
  createdAt: any;
}

const WalkerUpdatesScreen: React.FC<WalkerUpdatesScreenProps> = ({ navigation }) => {
  const [requests, setRequests] = useState<WalkRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch walk requests for this wanderer
    const requestsRef = collection(db, 'walkRequests');
    const requestsQuery = query(
      requestsRef,
      where('wandererId', '==', user.uid),
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
        console.error('Error fetching walk requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleChatWithWalker = (walkerId: string) => {
    // TODO: Navigate to chat screen
    console.log('Chat with walker:', walkerId);
  };

  const handleCallWalker = (walkerId: string) => {
    // TODO: Implement call functionality
    console.log('Call walker:', walkerId);
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
            <View key={request.id}>
              {/* Acceptance Card */}
              <View style={styles.acceptanceCard}>
                <Text style={styles.acceptanceText}>
                  Walker "{request.walkerName}" has accepted your request..!!
                </Text>
              </View>

              {/* Meeting Info */}
              <Text style={styles.meetingInfo}>
                Meet {request.walkerName} at the pickup point in next {request.meetingTime || '15 minutes'}...
              </Text>

              {/* Contact Section */}
              <Text style={styles.contactTitle}>Need to contact the walker?</Text>

              {/* Chat Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleChatWithWalker(request.walkerId)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Chat with Walker</Text>
              </TouchableOpacity>

              {/* Call Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCallWalker(request.walkerId)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Call with Walker</Text>
              </TouchableOpacity>
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
  acceptanceCard: {
    backgroundColor: '#E8F0FE',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  acceptanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 24,
  },
  meetingInfo: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 30,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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

export default WalkerUpdatesScreen;
