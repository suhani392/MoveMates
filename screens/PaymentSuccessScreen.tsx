import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type PaymentSuccessScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<
    {
      params: {
        amount: number;
        method: string;
        walkerName?: string;
        isWandererView: boolean;
        walkerId?: string;
        wandererId?: string;
        requestId?: string;
      };
    },
    'params'
  >;
};

const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  navigation,
  route,
}) => {
  const { amount, method, walkerName, isWandererView, walkerId, wandererId, requestId } = route.params;
  const { userData } = useAuth();
  const scaleAnim = new Animated.Value(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    // Animate checkmark
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

      // Show rating modal after 2 seconds only for wanderers
    if (isWandererView) {
      const timer = setTimeout(() => {
        setShowRatingModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return;

    setSubmittingRating(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get user name
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userName = userDoc.exists() ? userDoc.data()?.name || 'Anonymous' : 'Anonymous';

          // Only allow wanderers to rate walkers
      if (isWandererView && walkerId) {
        await addDoc(collection(db, 'reviews'), {
          walkerId: walkerId,
          userId: user.uid,
          userName: userName,
          rating: selectedRating,
          createdAt: serverTimestamp(),
          requestId: requestId || null,
        });
      }

      setShowRatingModal(false);
      setSelectedRating(0);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSkipRating = () => {
    setShowRatingModal(false);
    setSelectedRating(0);
  };

  const handleGoHome = () => {
    // Navigate to appropriate home screen based on role
    if (userData?.role === 'wanderer') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'RequestWalk' }],
      });
    } else if (userData?.role === 'walker') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'WalkerHome' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="check" size={80} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          {isWandererView
            ? 'Thank you for using MoveMates'
            : 'Payment confirmed successfully'}
        </Text>

        {/* Payment Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>₹{amount.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{method.toUpperCase()}</Text>
          </View>
          {walkerName && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {isWandererView ? 'Walker' : 'Wanderer'}
                </Text>
                <Text style={styles.detailValue}>{walkerName}</Text>
              </View>
            </>
          )}
        </View>

        {/* Thank You Message */}
        <View style={styles.thankYouCard}>
          <MaterialIcons name="favorite" size={24} color="#EF4444" />
          <Text style={styles.thankYouText}>
            {isWandererView
              ? 'We hope you had a great walk! Your safety and satisfaction are our priority.'
              : 'Thank you for being an amazing walker! Your dedication makes MoveMates special.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <MaterialIcons name="home" size={24} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleSkipRating}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContent}>
            <Text style={styles.ratingModalTitle}>
              Rate Your {isWandererView ? 'Walker' : 'Wanderer'}
            </Text>
            <Text style={styles.ratingModalSubtitle}>
              How was your experience?
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="star"
                    size={50}
                    color={star <= selectedRating ? '#FFC107' : '#E0E0E0'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.ratingModalButtons}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipRating}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitRatingButton,
                  selectedRating === 0 && styles.submitRatingButtonDisabled,
                ]}
                onPress={handleSubmitRating}
                disabled={selectedRating === 0 || submittingRating}
                activeOpacity={0.7}
              >
                <Text style={styles.submitRatingButtonText}>
                  {submittingRating ? 'Submitting...' : 'Submit'}
                </Text>
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
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  thankYouCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  thankYouText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  footerNote: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 24,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  ratingModalContent: {
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
  ratingModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingModalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  ratingModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitRatingButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitRatingButtonDisabled: {
    opacity: 0.4,
  },
  submitRatingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PaymentSuccessScreen;
