import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch, Modal, Image, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, DocumentData } from 'firebase/firestore';
import { WalkRequestService, WalkRequest } from '../services/walkRequestService';
import { useToast } from '../contexts/ToastContext';

type WalkerHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

// Remove the old interface - using the one from service

const WalkerHomeScreen: React.FC<WalkerHomeScreenProps> = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<WalkRequest[]>([]);
  const [todaysWalks, setTodaysWalks] = useState<number>(0);
  const [todaysEarnings, setTodaysEarnings] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const { userData } = useAuth();
  const { showToast } = useToast();

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

  // Enhanced debugging function to check all requests
  const debugWalkRequests = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user found for debug');
        return;
      }

      console.log('=== DEBUGGING WALK REQUESTS ===');
      console.log('Walker UID:', user.uid);
      
      // 1. Check walk requests assigned to this walker
      const walkerQuery = query(
        collection(db, 'walkRequests'),
        where('walkerId', '==', user.uid)
      );
      const walkerSnapshot = await getDocs(walkerQuery);
      console.log(`Found ${walkerSnapshot.docs.length} requests for this walker`);

      const walkerRequests = walkerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _exists: true
      }));
      
      // Log details of each request
      walkerRequests.forEach((req: any) => {
        console.log(`\n--- Request ${req.id} ---`);
        console.log('Status:', req.status);
        console.log('Walker ID:', req.walkerId);
        console.log('Wanderer ID:', req.wandererId);
        console.log('Scheduled:', req.scheduledDate, req.scheduledTime);
        console.log('Created At:', req.createdAt?.toDate?.() || 'No creation date');
        console.log('All fields:', Object.keys(req));
      });
      
      // Check if any requests are pending but not showing up
      const pendingRequests = walkerRequests.filter((req: any) => req.status === 'pending');
      console.log(`\nFound ${pendingRequests.length} PENDING requests`);
      
      return {
        totalRequests: walkerSnapshot.docs.length,
        walkerRequests: walkerRequests.length,
        pendingRequests: pendingRequests.length,
        requests: walkerRequests
      };
    } catch (error) {
      console.error('Error in debugWalkRequests:', error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    console.log('Current auth user:', user);
    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    console.log('User UID:', user.uid);
    console.log('User data:', userData);
    
    // Run the debug function
    debugWalkRequests().then(debugInfo => {
      console.log('Debug info:', debugInfo);
    });

    // When userData arrives/changes, update availability and online status once
    if (userData) {
      console.log('Setting availability to:', userData.available !== undefined ? userData.available : true);
      setIsAvailable(userData.available !== undefined ? userData.available : true);
      updateDoc(doc(db, 'users', user.uid), {
        isOnline: true,
        currentWalkStatus: 'idle',
      }).catch(error => {
        console.error('Error updating user status:', error);
      });
    }

    // Get today's date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Subscribe to ALL walk requests for this walker
    const requestsRef = collection(db, 'walkRequests');
    
    // First, try with a simple query to see if we get any results
    const initialQuery = query(
      requestsRef,
      where('walkerId', '==', user.uid)
    );
    
    console.log('Setting up listener for walker:', user.uid);
    
    const unsubscribe = onSnapshot(
      initialQuery, 
      (snapshot) => {
        console.log('=== SNAPSHOT UPDATE ===');
        console.log(`Received ${snapshot.docs.length} documents`);
        
        const allRequests = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Request ${doc.id}:`, {
            status: data.status,
            walkerId: data.walkerId,
            wandererId: data.wandererId,
            scheduled: `${data.scheduledDate} ${data.scheduledTime}`,
            createdAt: data.createdAt?.toDate?.() || 'No date'
          });
          
          return {
            id: doc.id,
            ...data
          } as WalkRequest;
        });

        // Log all requests for debugging
        console.log('All requests for this walker:', allRequests);
        
        // Filter for pending requests
        const pendingRequests = allRequests.filter(request => {
          const isPending = request.status === 'pending';
          if (!isPending) {
            console.log(`Skipping non-pending request ${request.id} with status:`, request.status);
          } else {
            console.log(`Including pending request ${request.id}`);
          }
          return isPending;
        });

        console.log(`Found ${pendingRequests.length} pending requests`);
        setIncomingRequests(pendingRequests);

        // Calculate today's walks and earnings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const completedWalks = allRequests.filter(request => {
          if (request.status !== 'completed') return false;
          
          // Check if the walk was completed today
          const completedAt = request.completedAt?.toDate?.();
          if (!completedAt) return false;
          
          return completedAt >= today;
        });

        // Update today's walks count
        setTodaysWalks(completedWalks.length);
        
        // Calculate today's earnings (assuming each completed walk earns 100)
        const earnings = completedWalks.length * 100; // Adjust the amount as needed
        setTodaysEarnings(earnings);
      },
      (error) => {
        console.error('Error in walk requests listener:', error);
      }
    );

    return () => {
      console.log('Cleaning up walk requests listener');
      unsubscribe();
    };
  }, [userData?.uid]); // Re-run when user ID changes

  // Fetch walker's total earnings
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Get today's date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(
      paymentsRef,
      where('walkerId', '==', user.uid),
      where('status', '==', 'paid')
    );

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        let total = 0;
        let todayWalks = 0;
        
        snapshot.forEach((doc) => {
          const payment = doc.data();
          // Only include payments that were made today
          const paymentDate = payment.updatedAt?.toDate?.() || payment.createdAt?.toDate?.();
          if (paymentDate >= today) {
            total += payment.walkerEarnings || 0;
            todayWalks++;
          }
        });

        setTodaysEarnings(total);
        setTodaysWalks(todayWalks);
      },
      (error) => {
        console.error('Error fetching payments:', error);
      }
    );

    return () => unsubscribe();
  }, [userData?.uid]);

  // Add a button to manually refresh and debug requests
  const handleManualRefresh = async () => {
    console.log('=== MANUAL REFRESH ===');
    const debugInfo = await debugWalkRequests();
    console.log('Manual refresh results:', debugInfo);
    showToast('Debug info logged to console', 'info');
  };

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
  const handleAcceptRequest = async (requestId: string, wandererId: string, walkerName: string) => {
    if (!wandererId) {
      console.error('No wandererId provided to handleAcceptRequest, aborting.');
      Alert.alert('Error', 'Cannot accept without a valid wanderer ID.');
      return;
    }
    try {
      await WalkRequestService.acceptRequest(requestId, wandererId, walkerName);
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
    <SafeAreaView style={{flex:1, backgroundColor:'#FFF', paddingTop: 32}}>
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
        <View style={[styles.availabilityCard, { backgroundColor: isAvailable ? '#E8F6E9' : '#F6E8E8' }]}>
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
              <Text style={styles.statNumber}>{todaysWalks}</Text>
              <Text style={styles.statLabel}>Today's Walks</Text>
            </View>
          </View>
          <View style={[styles.statCard, styles.purpleCard]}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="account-balance-wallet" size={28} color="#5B21B6" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statNumber}>₹{todaysEarnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
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
              {/* Request Details */}
              <View style={styles.requestDetails}>
                  <Text style={styles.requestName}>{request.wandererName}</Text>
                
                {/* Show different format based on walkType */}
                {request.walkType === 'route' || !request.walkType ? (
                  <>
                    <Text style={styles.requestInfo} numberOfLines={1} ellipsizeMode="tail">Pickup: {request.pickup}</Text>
                    <Text style={styles.requestInfo} numberOfLines={1} ellipsizeMode="tail">Destination: {request.destination}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.requestInfo} numberOfLines={1} ellipsizeMode="tail">Location: {request.pickup || request.meetingPoint}</Text>
                    <Text style={styles.requestInfo}>Type: {
                      request.walkType === 'nearby' ? 'Nearby Walk' :
                      request.walkType === 'exploringWalk' ? 'Exploring Walk' :
                      request.walkType === 'helpingHand' ? 'Helping Hand' :
                      request.walkType === 'suggestiveWalk' ? 'Suggestive Walk' :
                      request.walkType
                    }</Text>
                    {request.duration && (
                      <Text style={styles.requestInfo}>Duration: {request.duration} min</Text>
                    )}
                  </>
                )}
                
                  <Text style={styles.requestInfo}>Date: {request.scheduledDate}</Text>
                  <Text style={styles.requestInfo}>Time: {request.scheduledTime}</Text>
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
          <Image source={require('../assets/walk.png')} style={{ width: 24, height: 24, tintColor: '#FFFFFF' }} />
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
    paddingTop: 15,
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
    bottom: 80,  // Slightly adjusted from 90
    right: 20,   // Moved further right from 30
    zIndex: 10,
  },
  bottomNavButton: {
    width: 50,    // Reduced from 60
    height: 50,   // Reduced from 60
    borderRadius: 25,  // Half of the new width/height
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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