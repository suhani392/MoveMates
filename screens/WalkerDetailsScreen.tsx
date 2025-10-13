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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type WalkerDetailsScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { walker: any } }, 'params'>;
};

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

const WalkerDetailsScreen: React.FC<WalkerDetailsScreenProps> = ({ navigation, route }) => {
  const walker = route.params?.walker;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch reviews for this walker
  useEffect(() => {
    if (!walker?.id) {
      setLoading(false);
      return;
    }

    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, where('walkerId', '==', walker.id));

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
  }, [walker?.id]);

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

  if (!walker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Walker not found</Text>
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
          <Text style={styles.headerTitle}>Walker</Text>
        </View>

        {/* Walker Card */}
        <View style={styles.walkerCard}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            {walker.image ? (
              <Image source={{ uri: walker.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="person" size={80} color="#CCCCCC" />
              </View>
            )}
          </View>

          {/* Walker Name with Verified Badge */}
          <View style={styles.nameContainer}>
            <Text style={styles.walkerName}>{walker.name}</Text>
            {walker.approved && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={18} color="#2196F3" />
                <Text style={styles.verifiedText}>verified</Text>
              </View>
            )}
          </View>

          {/* About Section */}
          {walker.about && (
            <Text style={styles.aboutText}>{walker.about}</Text>
          )}

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            {walker.age && (
              <Text style={styles.detailText}>Age : {walker.age}</Text>
            )}
            <Text style={styles.detailText}>Pace : {walker.walkingPace || '---'}</Text>
            <Text style={styles.detailText}>
              Price : Rs. {walker.pricePerHour || 0}/hour
            </Text>
            {walker.languages && (
              <Text style={styles.detailText}>Languages : {walker.languages}</Text>
            )}
            {walker.hobbies && (
              <Text style={styles.detailText}>Hobbies : {walker.hobbies}</Text>
            )}
          </View>

          {/* Ratings Section */}
          <View style={styles.ratingsSection}>
            <Text style={styles.sectionTitle}>Ratings</Text>
            <View style={styles.ratingsContent}>
              {/* Average Rating */}
              <View style={styles.averageRatingContainer}>
                <Text style={styles.averageRatingNumber}>
                  {walker.rating ? walker.rating.toFixed(1) : '0.0'}
                </Text>
                {renderStars(Math.round(walker.rating || 0))}
              </View>

              {/* Rating Distribution */}
              <View style={styles.ratingDistribution}>
                {[5, 4, 3, 2, 1].map((stars) =>
                  renderRatingBar(stars, ratingDistribution[stars as keyof typeof ratingDistribution])
                )}
              </View>
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </Text>
            {loading ? (
              <View style={styles.loadingReviews}>
                <ActivityIndicator size="small" color="#6C63FF" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUserInfo}>
                      <View style={styles.reviewAvatar}>
                        <MaterialIcons name="person" size={24} color="#666666" />
                      </View>
                      <View>
                        <Text style={styles.reviewUserName}>
                          {review.userName || 'Anonymous'}
                        </Text>
                        {review.createdAt && (
                          <Text style={styles.reviewDate}>
                            {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.noReviewsContainer}>
                <MaterialIcons name="rate-review" size={40} color="#CCCCCC" />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Request Walker Button */}
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => {
            // Navigate to walker requested screen
            navigation.navigate('WalkerRequested', { 
              walker: walker,
              scheduleData: route.params?.scheduleData 
            });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.requestButtonText}>Request Walker</Text>
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
  walkerCard: {
    backgroundColor: '#E8F0FE',
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
  walkerName: {
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
  requestButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
  reviewsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999999',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  loadingReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 10,
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default WalkerDetailsScreen;
