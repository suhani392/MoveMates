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
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type WalkerProfileScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { walkerId: string } }, 'params'>;
};

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface Walker {
  id: string;
  name: string;
  email: string;
  phone: string;
  walkingPace: string;
  pricePerHour: number;
  age: number;
  experience: string;
  languages: string;
  hobbies: string;
  about: string;
  image?: string;
  profileImage?: string;
  rating?: number;
}

const WalkerProfileScreen: React.FC<WalkerProfileScreenProps> = ({ navigation, route }) => {
  const { walkerId } = route.params;
  const [walker, setWalker] = useState<Walker | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch walker details
  useEffect(() => {
    const fetchWalker = async () => {
      try {
        const walkerDoc = await getDoc(doc(db, 'users', walkerId));
        if (walkerDoc.exists()) {
          setWalker({ id: walkerDoc.id, ...walkerDoc.data() } as Walker);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching walker:', error);
        setLoading(false);
      }
    };

    fetchWalker();
  }, [walkerId]);

  // Fetch reviews
  useEffect(() => {
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, where('walkerId', '==', walkerId));

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
      },
      (error) => {
        console.error('Error fetching reviews:', error);
      }
    );

    return () => unsubscribe();
  }, [walkerId]);

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

  const renderRatingBar = (stars: number, count: number) => {
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return (
      <View key={stars} style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{stars}</Text>
        <MaterialIcons name="star" size={16} color="#FFC107" />
        <View style={styles.ratingBarContainer}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    if (comment.trim() === '') {
      Alert.alert('Comment Required', 'Please write a comment');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      // Get user name
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userName = userDoc.exists() ? userDoc.data()?.name || 'Anonymous' : 'Anonymous';

      await addDoc(collection(db, 'reviews'), {
        walkerId: walkerId,
        userId: user.uid,
        userName: userName,
        rating: rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Your review has been submitted!');
      setShowReviewModal(false);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Walker Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Walker Card */}
        <View style={styles.walkerCard}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            {walker.image || walker.profileImage ? (
              <Image source={{ uri: walker.image || walker.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="person" size={80} color="#CCCCCC" />
              </View>
            )}
          </View>

          {/* Walker Name with Verified Badge */}
          <View style={styles.nameContainer}>
            <Text style={styles.walkerName}>{walker.name}</Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={18} color="#2196F3" />
              <Text style={styles.verifiedText}>verified</Text>
            </View>
          </View>

          {/* About Section */}
          {walker.about && (
            <View style={styles.aboutSection}>
              <Text style={styles.detailLabel}>About</Text>
              <Text style={styles.detailValue}>{walker.about}</Text>
            </View>
          )}

          {/* Details Section */}
          <View style={styles.detailsSection}>
            {(walker as any).dob && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>
                  {new Date((walker as any).dob).toLocaleDateString()}
                </Text>
              </View>
            )}
            {(walker as any).gender && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{(walker as any).gender}</Text>
              </View>
            )}
            {walker.age && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{walker.age}</Text>
              </View>
            )}
            {(walker as any).motherTongue && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mother Tongue</Text>
                <Text style={styles.detailValue}>{(walker as any).motherTongue}</Text>
              </View>
            )}
            {((walker as any).preferredLanguage || walker.languages) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Preferred Languages</Text>
                <Text style={styles.detailValue}>
                  {(walker as any).preferredLanguage || walker.languages}
                </Text>
              </View>
            )}
            {(walker as any).contactNo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <Text style={styles.detailValue}>{(walker as any).contactNo}</Text>
              </View>
            )}
            {walker.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{walker.email}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pace</Text>
              <Text style={styles.detailValue}>{walker.walkingPace || 'Moderate'}</Text>
            </View>
            {walker.hobbies && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hobbies</Text>
                <Text style={styles.detailValue}>{walker.hobbies}</Text>
              </View>
            )}
            {walker.experience && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Experience</Text>
                <Text style={styles.detailValue}>{walker.experience}</Text>
              </View>
            )}
            {walker.pricePerHour && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate</Text>
                <Text style={styles.detailValue}>₹{walker.pricePerHour}/hour</Text>
              </View>
            )}
          </View>

          {/* Ratings Section */}
          <View style={styles.ratingsSection}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
            <View style={styles.ratingsContent}>
              {/* Average Rating */}
              <View style={styles.averageRatingContainer}>
                <Text style={styles.averageRatingNumber}>
                  {walker.rating ? walker.rating.toFixed(1) : totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0'}
                </Text>
                {renderStars(Math.round(walker.rating || (totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0)))}
                <Text style={styles.totalReviewsText}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
              </View>

              {/* Rating Distribution */}
              <View style={styles.ratingDistribution}>
                {[5, 4, 3, 2, 1].map((stars) =>
                  renderRatingBar(stars, ratingDistribution[stars as keyof typeof ratingDistribution])
                )}
              </View>
            </View>
          </View>

          {/* Reviews List */}
          {reviews.length > 0 && (
            <View style={styles.reviewsListSection}>
              <Text style={styles.sectionTitle}>Recent Reviews</Text>
              {reviews.slice(0, 5).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUserName}>{review.userName}</Text>
                    {renderStars(review.rating)}
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add Review Button */}
        <TouchableOpacity
          style={styles.addReviewButton}
          onPress={() => setShowReviewModal(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="rate-review" size={20} color="#FFFFFF" />
          <Text style={styles.addReviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Rating Selection */}
            <View style={styles.ratingSelectionContainer}>
              <Text style={styles.ratingSelectionLabel}>Your Rating</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <MaterialIcons
                      name="star"
                      size={40}
                      color={star <= rating ? '#FFC107' : '#E0E0E0'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Comment Input */}
            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>Your Review</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience with this walker..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitReview}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
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
    paddingTop: 32,
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
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  walkerCard: {
    backgroundColor: '#F7EDD9',
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
  aboutSection: {
    marginBottom: 20,
  },
  detailsSection: {
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
  ratingsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
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
  totalReviewsText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
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
    backgroundColor: '#FFC107',
  },
  ratingBarCount: {
    fontSize: 12,
    color: '#666666',
    width: 25,
    textAlign: 'right',
  },
  reviewsListSection: {
    marginTop: 20,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  addReviewButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  addReviewButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  ratingSelectionContainer: {
    marginBottom: 20,
  },
  ratingSelectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  commentContainer: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#000000',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default WalkerProfileScreen;
