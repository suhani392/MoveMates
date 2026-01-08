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
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type ChooseWalkerScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { scheduleData?: any } }, 'params'>;
};

interface Walker {
  id: string;
  uid: string;
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
  approved: boolean;
  createdAt: any;
  role: string;
  image?: string;
  rating?: number;
  available?: boolean;
  isOnline?: boolean;
  currentWalkStatus?: 'idle' | 'busy' | 'offline';
}

const ChooseWalkerScreen: React.FC<ChooseWalkerScreenProps> = ({ navigation, route }) => {
  const scheduleData = route.params?.scheduleData;
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug schedule data
  useEffect(() => {
    console.log('ChooseWalkerScreen scheduleData:', scheduleData);
  }, [scheduleData]);

  const formatScheduleInfo = () => {
    if (!scheduleData) return null;
    
    const dateObj = new Date(scheduleData.scheduledDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    return {
      day: dayName,
      date: dateStr,
      time: scheduleData.scheduledTime,
    };
  };

  const scheduleInfo = formatScheduleInfo();

  // Calculate average rating for a walker from reviews
  const calculateWalkerRating = async (walkerId: string): Promise<number> => {
    try {
      const reviewsRef = collection(db, 'reviews');
      const reviewsQuery = query(reviewsRef, where('walkerId', '==', walkerId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      if (reviewsSnapshot.empty) {
        return 0;
      }
      
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      const averageRating = totalRating / reviews.length;
      
      return Math.round(averageRating * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating rating for walker:', walkerId, error);
      return 0;
    }
  };

  // Fetch walkers from Firestore (users with role "walker" and approved)
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const walkersQuery = query(
      usersRef, 
      where('role', '==', 'walker'),
      where('approved', '==', true)
    );

    const unsubscribe = onSnapshot(
      walkersQuery,
      async (snapshot) => {
        console.log('Firestore query returned:', snapshot.size, 'walkers');
        
        if (!snapshot.empty) {
          const walkersPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            console.log('Walker data:', data);
            // Determine availability based on multiple factors
            const isOnline = data.isOnline || false;
            const currentWalkStatus = data.currentWalkStatus || 'offline';
            const availableToggle = data.available !== undefined ? data.available : true;
            
            // Walker is available only if:
            // 1. They have set available toggle to true
            // 2. They are online
            // 3. They are not busy in a walk
            const isAvailable = availableToggle && isOnline && currentWalkStatus !== 'busy';
            
            // Calculate actual rating from reviews
            const actualRating = await calculateWalkerRating(doc.id);
            
            return {
              id: doc.id,
              uid: data.uid || doc.id,
              name: data.name || '---',
              email: data.email || '',
              phone: data.phone || '',
              walkingPace: data.walkingPace || '---',
              pricePerHour: data.pricePerHour || 0,
              age: data.age || 0,
              experience: data.experience || '',
              languages: data.languages || '',
              hobbies: data.hobbies || '',
              about: data.about || '',
              approved: data.approved || false,
              createdAt: data.createdAt,
              role: data.role || 'walker',
              image: data.image || data.profileImage || undefined,
              rating: actualRating,
              available: isAvailable,
              isOnline: isOnline,
              currentWalkStatus: currentWalkStatus,
            };
          });
          
          const walkersList = await Promise.all(walkersPromises);
          console.log('Walkers list created with ratings:', walkersList);
          setWalkers(walkersList);
        } else {
          console.log('No walkers found in Firestore');
          setWalkers([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching walkers:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const renderWalkerCard = (walker: Walker) => {
    return (
      <TouchableOpacity 
        key={walker.id} 
        style={styles.walkerCard}
        onPress={() => navigation.navigate('WalkerDetails', { walker, scheduleData })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Profile Image with Rating Badge */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              {walker.image ? (
                <Image source={{ uri: walker.image }} style={styles.profileImageActual} />
              ) : (
                <MaterialIcons name="person" size={60} color="#CCCCCC" />
              )}
            </View>
            {/* Rating Badge on Bottom Right */}
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={14} color="#FFC107" />
              <Text style={styles.ratingBadgeText}>
                {walker.rating ? walker.rating.toFixed(1) : '0.0'}
              </Text>
            </View>
          </View>

          {/* Walker Info */}
          <View style={styles.walkerInfo}>
            <Text style={styles.walkerName}>{walker.name || '---'}</Text>
            <Text style={styles.walkerDetail}>Pace: {walker.walkingPace || '---'}</Text>
            <Text style={styles.walkerPrice}>
              {walker.pricePerHour ? `₹${walker.pricePerHour}/hour` : '---'}
            </Text>
          </View>
        </View>

        {/* Availability Badge - Bottom Right of Card */}
        <View style={styles.availabilityBadgeContainer}>
          <View style={[
            styles.availabilityBadge,
            walker.available ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <Text style={styles.availabilityText}>
              {walker.available ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose a Walker</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Schedule Info Display */}
        {scheduleInfo && (
          <View style={styles.scheduleInfoContainer}>
            <Text style={styles.scheduleInfoTitle}>
              The schedule you have selected is:
            </Text>
            <Text style={styles.scheduleInfoText}>
              {scheduleInfo.day}, {scheduleInfo.date} at {scheduleInfo.time}
            </Text>
          </View>
        )}

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Choose a walker of your choice to enjoy your walk
        </Text>

        {/* Walkers Section */}
        <Text style={styles.sectionTitle}>Walkers nearby:</Text>

        {/* Walker Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading walkers...</Text>
          </View>
        ) : walkers.length > 0 ? (
          walkers.map((walker) => renderWalkerCard(walker))
        ) : (
          <View style={styles.noWalkersContainer}>
            <MaterialIcons name="person-outline" size={60} color="#CCCCCC" />
            <Text style={styles.noWalkersText}>No walkers enrolled yet</Text>
            <Text style={styles.noWalkersSubtext}>
              Check back later for available walkers
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  scheduleInfoContainer: {
    marginBottom: 20,
  },
  scheduleInfoTitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
  },
  scheduleInfoText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 25,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 15,
  },
  walkerCard: {
    backgroundColor: '#E8F6E9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    minHeight: 160,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 15,
    position: 'relative',
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImageActual: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 2,
  },
  walkerInfo: {
    flex: 1,
  },
  walkerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  walkerDetail: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  walkerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 4,
  },
  availabilityBadgeContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: '#81C784',
  },
  unavailableBadge: {
    backgroundColor: '#E57373',
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
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
  noWalkersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noWalkersText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 20,
    textAlign: 'center',
  },
  noWalkersSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ChooseWalkerScreen;
