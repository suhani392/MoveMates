import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch, Modal, Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { WalkRequestService, WalkRequest } from '../services/walkRequestService';

type WalkerHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

// Remove the old interface - using the one from service

const WalkerHomeScreen: React.FC<WalkerHomeScreenProps> = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<WalkRequest[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const { userData } = useAuth();

  // Listen for unread notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const unreadQuery = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setHasUnreadNotifications(!snapshot.empty);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
      const user = auth.currentUser;
    if (user) {
      // When userData arrives/changes, update availability and online status once
      if (userData) {
        setIsAvailable(userData.available !== undefined ? userData.available : true);
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: true,
          currentWalkStatus: 'idle',
        }).catch(() => {});
      }

      // Subscribe to incoming walk requests
      const unsubscribe = WalkRequestService.subscribeToWalkerRequests(user.uid, (requests) => {
        console.log('Received walk requests:', requests.length, 'requests');
        setIncomingRequests(requests);
      });

      // Test code removed - system is working!

      return () => unsubscribe();
    }
  }, [userData]);

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

  // Handle accepting a request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await WalkRequestService.acceptRequest(requestId);
      // Update walker status to busy
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          currentWalkStatus: 'busy',
        });
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  // Handle declining a request
  const handleDeclineRequest = async (requestId: string) => {
    try {
      await WalkRequestService.declineRequest(requestId);
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialIcons name="notifications" size={28} color="#FFFFFF" />
          {hasUnreadNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>Hello, {userData?.name || 'User Name'}!</Text>

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
        <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Incoming Requests</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              console.log('Manual refresh triggered');
              setRefreshKey(prev => prev + 1);
            }}
          >
            <MaterialIcons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        {incomingRequests.length === 0 ? (
          <View style={styles.noRequestsContainer}>
            <MaterialIcons name="inbox" size={48} color="#CCCCCC" />
            <Text style={styles.noRequestsText}>No pending requests</Text>
            <Text style={styles.noRequestsSubtext}>You'll see walk requests here when they come in</Text>
          </View>
        ) : (
          incomingRequests.map((request) => (
            <TouchableOpacity 
              key={request.id} 
              style={styles.requestCard}
              onPress={() => navigation.navigate('WandererDetails', { 
                wanderer: {
                  id: request.wandererId,
                  name: request.wandererName,
                  image: request.wandererImage,
                  pickup: request.pickup,
                  destination: request.destination,
                  preference: request.preference,
                },
                requestId: request.id,
              })}
              activeOpacity={0.7}
            >
            <View style={styles.cardContent}>
                {/* Profile Image */}
              <View style={styles.profileImageContainer}>
                  {request.wandererImage ? (
                    <Image 
                      source={{ uri: request.wandererImage }} 
                      style={styles.profileImageActual} 
                    />
                  ) : (
                <View style={styles.profileImage}>
                  <MaterialIcons name="person" size={60} color="#CCCCCC" />
                </View>
                  )}
              </View>

              {/* Wanderer Info */}
              <View style={styles.requestDetails}>
                  <Text style={styles.requestName}>{request.wandererName}</Text>
                <Text style={styles.requestInfo}>Pickup: {request.pickup}</Text>
                <Text style={styles.requestInfo}>Destination: {request.destination}</Text>
                  <Text style={styles.requestInfo}>Date: {request.scheduledDate}</Text>
                  <Text style={styles.requestInfo}>Time: {request.scheduledTime}</Text>
                  {request.preference && (
                <Text style={styles.requestInfo}>Preference: {request.preference}</Text>
                  )}
                  {request.pricePerHour && (
                    <Text style={styles.requestInfo}>Rate: ₹{request.pricePerHour}/hour</Text>
                  )}
                </View>
              </View>

              {/* Tap to View Details Hint */}
              <View style={styles.viewDetailsHint}>
                <Text style={styles.viewDetailsText}>Tap to view details</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation Icon */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.bottomNavButton}
          onPress={() => navigation.navigate('WandererUpdates')}
        >
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
                {userData?.profileImage || userData?.image ? (
                  <Image
                    source={{ uri: (userData.profileImage || userData.image) }}
                    style={{ width: 70, height: 70, borderRadius: 35 }}
                  />
                ) : (
                  <MaterialIcons name="person" size={40} color="#666" />
                )}
              </View>
              <Text style={styles.userName}>{userData?.name || 'User Name'}</Text>
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
                navigation.navigate('Notifications');
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
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
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
  // New styles for request management
  noRequestsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noRequestsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  noRequestsSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#22C55E',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileImageActual: {
    width: 110,
    height: 110,
    borderRadius: 15,
  },
  viewDetailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default WalkerHomeScreen;