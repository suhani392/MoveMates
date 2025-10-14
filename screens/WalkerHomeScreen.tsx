import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch, Modal, Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type WalkerHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkRequest {
  id: string;
  name: string;
  rating: number;
  pace: string;
  pickup: string;
  destination: string;
  preference: string;
}

const WalkerHomeScreen: React.FC<WalkerHomeScreenProps> = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState('User Name');

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || 'User Name');
            // Load the current availability status from Firestore
            setIsAvailable(userData.available !== undefined ? userData.available : true);
            
            // Set user as online when they open the walker home screen
            await updateDoc(doc(db, 'users', user.uid), {
              isOnline: true,
              currentWalkStatus: 'idle',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const openDrawer = () => {
    setMenuVisible(true);
  };

  const closeDrawer = () => {
    setMenuVisible(false);
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    setIsAvailable(value);
    
    // Update availability in Firestore
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          available: value,
          isOnline: true, // Ensure they're marked as online
        });
        console.log('Availability updated to:', value);
      } catch (error) {
        console.error('Error updating availability:', error);
      }
    }
  };

  // Mock data for incoming requests
  const incomingRequests: WalkRequest[] = [
    {
      id: '1',
      name: 'Suhani Badhe',
      rating: 4.9,
      pace: 'Slow',
      pickup: 'S3 Lifestyle Apartment',
      destination: 'Rose Icon',
      preference: 'Solo',
    },
    {
      id: '2',
      name: 'Atharva Gholap',
      rating: 4.5,
      pace: 'Fast',
      pickup: 'S3 Lifestyle Apartment',
      destination: 'Rose Icon',
      preference: 'Group',
    },
    {
      id: '3',
      name: 'Sushant Manel',
      rating: 4.0,
      pace: 'Moderate',
      pickup: 'S3 Lifestyle Apartment',
      destination: 'Rose Icon',
      preference: 'Pet',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => {
          // Navigate to notifications screen
          // navigation.navigate('Notifications');
        }}>
          <MaterialIcons name="notifications" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>Hello, {userName}!</Text>

        {/* Availability Toggle Card */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={styles.availabilityIconContainer}>
              <Ionicons 
                name={isAvailable ? "checkmark-circle" : "close-circle"} 
                size={32} 
                color={isAvailable ? "#22C55E" : "#EF4444"} 
              />
            </View>
            <View style={styles.availabilityTextContainer}>
              <Text style={styles.availabilityTitle}>Available for a walk?</Text>
              <Text style={styles.availabilitySubtitle}>
                {isAvailable ? "You're ready to accept walks" : "You're currently unavailable"}
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.customToggle,
                isAvailable ? styles.toggleActive : styles.toggleInactive
              ]}
              onPress={() => handleAvailabilityToggle(!isAvailable)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.toggleThumb,
                isAvailable ? styles.thumbActive : styles.thumbInactive
              ]}>
                <Ionicons 
                  name={isAvailable ? "checkmark" : "close"} 
                  size={16} 
                  color="#FFFFFF" 
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.purpleCard]}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="directions-walk" size={28} color="#5B21B6" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Total Walks</Text>
            </View>
            <View style={styles.statTrendBadge}>
              <Ionicons name="trending-up" size={12} color="#22C55E" />
              <Text style={styles.statTrendText}>+12%</Text>
            </View>
          </View>
          <View style={[styles.statCard, styles.purpleCard]}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="account-balance-wallet" size={28} color="#5B21B6" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statNumber}>₹2,780</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
            <View style={styles.statTrendBadge}>
              <Ionicons name="trending-up" size={12} color="#22C55E" />
              <Text style={styles.statTrendText}>+8%</Text>
            </View>
          </View>
        </View>

        {/* Incoming Requests */}
        <Text style={styles.sectionTitle}>Incoming Requests</Text>
        
        {incomingRequests.map((request) => (
          <TouchableOpacity 
            key={request.id} 
            style={styles.requestCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('WandererDetails', { wanderer: request })}
          >
            <View style={styles.cardContent}>
              {/* Profile Image with Rating Badge */}
              <View style={styles.profileImageContainer}>
                <View style={styles.profileImage}>
                  <MaterialIcons name="person" size={60} color="#CCCCCC" />
                </View>
                {/* Rating Badge on Bottom Right */}
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={14} color="#FFC107" />
                  <Text style={styles.ratingBadgeText}>{request.rating}</Text>
                </View>
              </View>

              {/* Wanderer Info */}
              <View style={styles.requestDetails}>
                <Text style={styles.requestName}>{request.name}</Text>
                <Text style={styles.requestInfo}>Pickup: {request.pickup}</Text>
                <Text style={styles.requestInfo}>Destination: {request.destination}</Text>
                <Text style={styles.requestInfo}>Preference: {request.preference}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation Icon */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.bottomNavButton}>
          <Image source={require('../assets/walk.png')} style={{ width: 28, height: 28, tintColor: '#FFFFFF' }} />
        </TouchableOpacity>
      </View>

      {/* Drawer */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={closeDrawer}
      >
        <View style={styles.overlay}>
          <View style={styles.drawer}>
            {/* Profile Header */}
            <TouchableOpacity 
              style={styles.profileHeader} 
              onPress={() => {
                closeDrawer();
                navigation.navigate('Profile');
              }}
            >
              <View style={styles.profileCircle}>
                <MaterialIcons name="person" size={40} color="#666" />
              </View>
              <Text style={styles.userName}>{userName}</Text>
            </TouchableOpacity>

            {/* Menu Items */}
            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
              }}
            >
              <Text style={styles.drawerText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // navigation.navigate('Notifications');
              }}
            >
              <Text style={styles.drawerText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('ContactUs');
              }}
            >
              <Text style={styles.drawerText}>Contact Us</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('HelpPolicy');
              }}
            >
              <Text style={styles.drawerText}>Help & Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.drawerText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('About');
              }}
            >
              <Text style={styles.drawerText}>About</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity 
              style={[styles.drawerItem, styles.logoutItem]} 
              onPress={() => { 
                closeDrawer();
                handleSignOut();
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
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
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  availabilityCard: {
    backgroundColor: '#E8F6E9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  availabilitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  customToggle: {
    width: 60,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#22C55E',
    alignItems: 'flex-end',
  },
  toggleInactive: {
    backgroundColor: '#EF4444',
    alignItems: 'flex-start',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbActive: {
    marginRight: 0,
  },
  thumbInactive: {
    marginLeft: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 18,
    position: 'relative',
  },
  purpleCard: {
    backgroundColor: '#D9DFF7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statTextContainer: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statTrendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 2,
  },
  statTrendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22C55E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  requestCard: {
    backgroundColor: '#F7EDD9',
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
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  requestInfo: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  bottomNavButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  // Drawer
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  drawer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  profileCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  drawerItem: {
    marginBottom: 35,
  },
  drawerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutItem: {
    position: 'absolute',
    bottom: 50,
    left: 30,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '600',
  },
});

export default WalkerHomeScreen;