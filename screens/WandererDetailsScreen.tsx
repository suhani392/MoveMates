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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { WalkRequestService } from '../services/walkRequestService';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

const WandererDetailsScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const wanderer = route.params?.wanderer;
  const requestId = route.params?.requestId;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch reviews for this wanderer
  useEffect(() => {
    if (!wanderer?.id) {
      setLoading(false);
      return;
    }

    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, where('wandererId', '==', wanderer.id));

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const reviewsList: Review[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Review));
          setReviews(reviewsList);
        } else {
          setReviews([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching reviews:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [wanderer?.id]);

  // Calculate rating distribution
  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const totalReviews = reviews.length;

  const renderRatingBar = (stars: number, count: number) => {
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return (
      <View key={stars} style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{stars}</Text>
        <View style={styles.ratingBarContainer}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>({count})</Text>
      </View>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name="star"
            size={20}
            color={star <= rating ? '#FFC107' : '#E0E0E0'}
          />
        ))}
      </View>
    );
  };

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

  const handleDeclineRequest = async () => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the walk request from ${wanderer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await WalkRequestService.declineRequest(requestId);
              Alert.alert(
                'Request Declined',
                'The walk request has been declined.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline the request. Please try again.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
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
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            {wanderer.image ? (
              <Image source={{ uri: wanderer.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="person" size={80} color="#CCCCCC" />
              </View>
            )}
          </View>

          {/* Wanderer Name with Verified Badge */}
          <View style={styles.nameContainer}>
            <Text style={styles.wandererName}>{wanderer.name}</Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={18} color="#2196F3" />
              <Text style={styles.verifiedText}>verified</Text>
            </View>
          </View>

          {/* About Section */}
          {wanderer.about && (
            <Text style={styles.aboutText}>{wanderer.about}</Text>
          )}

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Text style={styles.detailText}>Pace : {wanderer.pace || 'Moderate'}</Text>
            <Text style={styles.detailText}>Pickup : {wanderer.pickup || '---'}</Text>
            <Text style={styles.detailText}>Destination : {wanderer.destination || '---'}</Text>
            {wanderer.languages && (
              <Text style={styles.detailText}>Languages : {wanderer.languages}</Text>
            )}
            <Text style={styles.detailText}>Preference : {wanderer.preference || 'Solo'}</Text>
          </View>

          {/* Ratings Section */}
          <View style={styles.ratingsSection}>
            <Text style={styles.sectionTitle}>Ratings</Text>
            <View style={styles.ratingsContent}>
              {/* Average Rating */}
              <View style={styles.averageRatingContainer}>
                <Text style={styles.averageRatingNumber}>
                  {wanderer.rating ? wanderer.rating.toFixed(1) : '4.9'}
                </Text>
                {renderStars(Math.round(wanderer.rating || 5))}
              </View>

              {/* Rating Distribution */}
              <View style={styles.ratingDistribution}>
                {[5, 4, 3, 2, 1].map((stars) =>
                  renderRatingBar(stars, ratingDistribution[stars as keyof typeof ratingDistribution])
                )}
              </View>
            </View>
          </View>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  wandererCard: {
    backgroundColor: '#D9DFF7',
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
  aboutText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 20,
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
  ratingsSection: {
    marginTop: 10,
  },
  ratingsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  averageRatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  averageRatingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingDistribution: {
    flex: 2,
    paddingLeft: 20,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    width: 15,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#5C6BC0',
    borderRadius: 4,
  },
  ratingBarCount: {
    fontSize: 12,
    color: '#666666',
    width: 30,
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
});

export default WandererDetailsScreen;
