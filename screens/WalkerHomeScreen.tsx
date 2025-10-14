import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch, Modal } from 'react-native';
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
        <Text style={styles.greeting}>Hello, User!</Text>

        {/* Availability Toggle Card */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={styles.availabilityTextContainer}>
              <Text style={styles.availabilityTitle}>Available for a walk?</Text>
              <Text style={styles.availabilitySubtitle}>
                Let the wanderer's know if you are available for a walk at the moment
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityToggle}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isAvailable ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.purpleCard]}>
            <Ionicons name="walk" size={40} color="#000000" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>WALKS</Text>
          </View>
          <View style={[styles.statCard, styles.purpleCard]}>
            <MaterialIcons name="account-balance-wallet" size={40} color="#000000" />
            <Text style={styles.statNumber}>RS. 2780</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
        </View>

        {/* Incoming Requests */}
        <Text style={styles.sectionTitle}>Incoming Requests</Text>
        
        {incomingRequests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestAvatar}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFA500" />
                <Text style={styles.ratingText}>{request.rating}</Text>
              </View>
            </View>
            <View style={styles.requestDetails}>
              <Text style={styles.requestName}>{request.name}</Text>
              <Text style={styles.requestInfo}>Pace : {request.pace}</Text>
              <Text style={styles.requestInfo}>Pickup : {request.pickup}</Text>
              <Text style={styles.requestInfo}>Destination : {request.destination}</Text>
              <Text style={styles.requestInfo}>Preference : {request.preference}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation Icon */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.bottomNavButton}>
          <Ionicons name="walk" size={32} color="#FFFFFF" />
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
    backgroundColor: '#D1FAE5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  availabilitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
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
    padding: 20,
    alignItems: 'center',
  },
  purpleCard: {
    backgroundColor: '#DDD6FE',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  requestAvatar: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginRight: 15,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  requestDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  requestInfo: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
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