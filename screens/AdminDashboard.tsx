import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Modal, Image, TextInput, RefreshControl } from 'react-native';

import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, doc, updateDoc, getDoc, serverTimestamp, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { MaterialIcons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: any;
}

type AdminDashboardProps = {
  navigation: StackNavigationProp<any>;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
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
  const [showAdmins, setShowAdmins] = useState(true);
  const [showWalkers, setShowWalkers] = useState(true);
  const [showWanderers, setShowWanderers] = useState(true);
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'walker' | 'wanderer'>('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [removalModalVisible, setRemovalModalVisible] = useState(false);
  const [selectedUserForRemoval, setSelectedUserForRemoval] = useState<User | null>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastTappedUserId, setLastTappedUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyActiveUsers, setDailyActiveUsers] = useState<{ date: string; count: number }[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null); // New state for quiz result
  const [resultModal, setResultModal] = useState<{ visible: boolean; userId: string }>({ visible: false, userId: '' }); // New state for quiz result modal
  const [rejectReason, setRejectReason] = useState(''); // New state for rejection reason

  useEffect(() => {
    fetchUsers();
    fetchDailyActiveUsers();
  }, []);

  // No manual fetch for current admin profile; we rely on useAuth()

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchText(searchText.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(t);
  }, [searchText]);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersList);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchUsers();
      await fetchDailyActiveUsers();
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDailyActiveUsers = async () => {
    try {
      // Get last 7 days of data
      const days = 7;
      const data: { date: string; count: number }[] = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Query users who were active on this day
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let count = 0;
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          const lastActive = userData.lastLocationUpdate?.toDate?.() || userData.createdAt?.toDate?.();
          
          if (lastActive && lastActive >= date && lastActive < nextDate) {
            count++;
          }
        });
        
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        data.push({ date: dateStr, count });
      }
      
      setDailyActiveUsers(data);
    } catch (error) {
      console.error('Error fetching daily active users:', error);
    }
  };

  const handleSearch = async () => {
    const q = searchText.trim().toLowerCase();
    setFilterMenuVisible(false);
    if (!q) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const list = usersSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as User[];
      const results = list.filter(u => (
        (roleFilter === 'all' || u.role === roleFilter) && ((u.name || '').toLowerCase().includes(q))
      ));
      setSearchResults(results);
      setSearchMode(true);
    } catch (e) {
      setSearchResults([]);
      setSearchMode(true);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setDebouncedSearchText('');
    setSearchResults([]);
    setSearchMode(false);
  };

  const handleApproveWalker = async (userId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { approved });
      Alert.alert('Success', `Walker ${approved ? 'approved' : 'rejected'}`);
      setDecisions(prev => ({ ...prev, [userId]: approved ? 'approved' : 'rejected' }));
      try {
        await addDoc(collection(db, 'audit_logs'), {
          actorId: auth.currentUser?.uid || 'admin',
          action: approved ? 'user.approve' : 'user.reject',
          targetType: 'user',
          targetId: userId,
          timestamp: serverTimestamp(),
        });
      } catch (e) { /* ignore audit log failures */ }
      fetchUsers(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const getUserPhotoUrl = (u: any): string | null => {
    if (!u) return null;
    const keys = [
      'profileImage', 'profileImageUrl', 'image', 'photoURL', 'photoUrl', 'avatar', 'avatarUrl', 'profilePic', 'profile_picture', 'profile_photo_url', 'imageUrl', 'picture', 'pic'
    ];
    for (const k of keys) {
      const v = u?.[k];
      if (typeof v === 'string' && v.length > 0) return v;
    }
    // arrays like images/photos
    if (Array.isArray(u?.images) && u.images[0]) return u.images[0];
    if (Array.isArray(u?.photos) && u.photos[0]) return u.photos[0];
    return null;
  };

  const handleCardTap = async (user: User) => {
    const now = Date.now();
    const within = now - lastTapTime < 800;
    const sameUser = lastTappedUserId === user.id;
    const nextCount = within && sameUser ? tapCount + 1 : 1;
    setTapCount(nextCount);
    setLastTapTime(now);
    setLastTappedUserId(user.id);
    if (nextCount >= 3) {
      let photo = getUserPhotoUrl(user as any);
      try {
        if (photo && photo.startsWith('gs://')) {
          const storage = getStorage();
          const url = await getDownloadURL(storageRef(storage, photo));
          photo = url;
        }
      } catch (e) {
        // fallthrough: will show alert below
      }
      if (photo && typeof photo === 'string') {
        // Accept http(s), data URLs, and any resolvable string
        navigation.navigate('ProfilePhoto', { name: (user as any).name || 'User', photoUrl: photo });
      } else {
        Alert.alert('No photo', 'This user has not set a profile photo.');
      }
      setTapCount(0);
      setLastTappedUserId(null);
    }
  };

  const openDrawer = () => {
    setMenuVisible(true);
  };

  const closeDrawer = () => {
    setMenuVisible(false);
  };

  // Group users by role for sectioned display (exclude removed)
  const admins = users.filter(u => u.role === 'admin' && (u as any).status !== 'removed');
  const walkers = users.filter(u => u.role === 'walker' && (u as any).status !== 'removed');
  const wanderers = users.filter(u => u.role === 'wanderer' && (u as any).status !== 'removed');

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading users...</Text>
      </SafeAreaView>
    );
  }

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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Analytics Graph */}
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsSectionTitle}>Daily Active Users</Text>
          <View style={styles.graphCard}>
            <View style={styles.graphContainer}>
              {dailyActiveUsers.length > 0 ? (
                <>
                  {/* Y-axis labels */}
                  <View style={styles.yAxisContainer}>
                    {[...Array(5)].map((_, i) => {
                      const maxCount = Math.max(...dailyActiveUsers.map(d => d.count), 10);
                      const value = Math.ceil(maxCount * (4 - i) / 4);
                      return (
                        <Text key={i} style={styles.yAxisLabel}>
                          {value}
                        </Text>
                      );
                    })}
                  </View>
                  
                  {/* Graph bars */}
                  <View style={styles.barsContainer}>
                    {dailyActiveUsers.map((day, index) => {
                      const maxCount = Math.max(...dailyActiveUsers.map(d => d.count), 10);
                      const heightPercentage = (day.count / maxCount) * 100;
                      
                      return (
                        <View key={index} style={styles.barColumn}>
                          <View style={styles.barWrapper}>
                            <View
                              style={[
                                styles.bar,
                                { height: `${heightPercentage}%` },
                              ]}
                            >
                              <Text style={styles.barLabel}>{day.count}</Text>
                            </View>
                          </View>
                          <Text style={styles.xAxisLabel}>{day.date}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View style={styles.graphPlaceholder}>
                  <Text style={styles.graphPlaceholderText}>Loading analytics...</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Stats Summary */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{users.length}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{walkers.length}</Text>
              <Text style={styles.statLabel}>Walkers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{wanderers.length}</Text>
              <Text style={styles.statLabel}>Wanderers</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>User Management</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.filterButton} onPress={() => setFilterMenuVisible(prev => !prev)}>
              <Text style={styles.filterButtonText}>
                {roleFilter === 'all' ? 'All' : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
              </Text>
            </TouchableOpacity>
            {filterMenuVisible && (
              <View style={styles.filterMenu}>
                <TouchableOpacity style={styles.filterOption} onPress={() => { setRoleFilter('all'); setFilterMenuVisible(false); }}>
                  <Text style={styles.filterOptionText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterOption} onPress={() => { setRoleFilter('admin'); setFilterMenuVisible(false); }}>
                  <Text style={styles.filterOptionText}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterOption} onPress={() => { setRoleFilter('walker'); setFilterMenuVisible(false); }}>
                  <Text style={styles.filterOptionText}>Walker</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterOption} onPress={() => { setRoleFilter('wanderer'); setFilterMenuVisible(false); }}>
                  <Text style={styles.filterOptionText}>Wanderer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          {searchMode && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {!searchMode && (roleFilter === 'all' || roleFilter === 'admin') && (
        <TouchableOpacity style={styles.roleHeader} onPress={() => setShowAdmins(prev => !prev)}>
          <Text style={styles.roleSectionTitle}>Admins ({admins.length})</Text>
          <MaterialIcons name={showAdmins ? 'expand-less' : 'expand-more'} size={22} color="#000" />
        </TouchableOpacity>
        )}
        {!searchMode && showAdmins && (roleFilter === 'all' || roleFilter === 'admin') && admins
          .filter(u => (roleFilter === 'all' || u.role === roleFilter) && (debouncedSearchText === '' || (u.name || '').toLowerCase().includes(debouncedSearchText)))
          .map((user) => (
          <TouchableOpacity key={user.id} activeOpacity={0.9} onPress={() => handleCardTap(user)}>
          <View style={[styles.userCard, styles.adminCard]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                { getUserPhotoUrl(user as any) ? (
                  <Image
                    source={{ uri: getUserPhotoUrl(user as any) as string }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <MaterialIcons name="person" size={28} color="#666" />
                )}
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.userCardName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userStatus}>
              Status: {user.approved ? 'Approved' : 'Pending'}
            </Text>
          </View>
          </TouchableOpacity>
        ))}

        {!searchMode && (roleFilter === 'all' || roleFilter === 'walker') && (
        <TouchableOpacity style={styles.roleHeader} onPress={() => setShowWalkers(prev => !prev)}>
          <Text style={styles.roleSectionTitle}>Walkers ({walkers.length})</Text>
          <MaterialIcons name={showWalkers ? 'expand-less' : 'expand-more'} size={22} color="#000" />
        </TouchableOpacity>
        )}
        {!searchMode && showWalkers && (roleFilter === 'all' || roleFilter === 'walker') && walkers
          .filter(u => (roleFilter === 'all' || u.role === roleFilter) && (debouncedSearchText === '' || (u.name || '').toLowerCase().includes(debouncedSearchText)))
          .map((user) => (
          <TouchableOpacity
            key={user.id}
            activeOpacity={0.9}
            onPress={() => handleCardTap(user)}
            onLongPress={() => {
              setSelectedUserForRemoval(user);
              setRemovalReason('');
              setRemovalModalVisible(true);
            }}
          >
          <View style={[styles.userCard, styles.walkerCard]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                {(user as any)?.profileImage || (user as any)?.image || (user as any)?.photoURL ? (
                  <Image
                    source={{ uri: ((user as any).profileImage || (user as any).image || (user as any).photoURL) }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <MaterialIcons name="person" size={24} color="#666" />
                )}
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.userCardName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userStatus}>
              Status: {user.approved
                ? 'Approved'
                : (decisions[user.id] === 'rejected' ? 'Rejected' : 'Pending')}
            </Text>
            {(!user.approved && !decisions[user.id]) && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.approveButton]}
                  onPress={() => handleApproveWalker(user.id, true)}
                  disabled={user.approved}
                >
                  <Text style={styles.buttonText}>
                    {user.approved ? 'Approved' : 'Approve'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={() => handleApproveWalker(user.id, false)}
                  disabled={user.approved}
                >
                  <Text style={styles.buttonText}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('UserDetails', { userId: user.id, role: user.role })}>
                <Text style={styles.moreDetails}>more details</Text>
              </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        ))}

        {!searchMode && (roleFilter === 'all' || roleFilter === 'wanderer') && (
        <TouchableOpacity style={styles.roleHeader} onPress={() => setShowWanderers(prev => !prev)}>
          <Text style={styles.roleSectionTitle}>Wanderers ({wanderers.length})</Text>
          <MaterialIcons name={showWanderers ? 'expand-less' : 'expand-more'} size={22} color="#000" />
        </TouchableOpacity>
        )}
        {!searchMode && showWanderers && (roleFilter === 'all' || roleFilter === 'wanderer') && wanderers
          .filter(u => (roleFilter === 'all' || u.role === roleFilter) && (debouncedSearchText === '' || (u.name || '').toLowerCase().includes(debouncedSearchText)))
          .map((user) => (
          <TouchableOpacity
            key={user.id}
            activeOpacity={0.9}
            onPress={() => handleCardTap(user)}
            onLongPress={() => {
              setSelectedUserForRemoval(user);
              setRemovalReason('');
              setRemovalModalVisible(true);
            }}
          >
          <View style={[styles.userCard, styles.wandererCard]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                {(user as any)?.profileImage || (user as any)?.image || (user as any)?.photoURL ? (
                  <Image
                    source={{ uri: ((user as any).profileImage || (user as any).image || (user as any).photoURL) }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <MaterialIcons name="person" size={24} color="#666" />
                )}
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.userCardName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userStatus}>
              Status: {user.approved ? 'Approved' : 'Pending'}
            </Text>
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('UserDetails', { userId: user.id, role: user.role })}>
                <Text style={styles.moreDetails}>more details</Text>
              </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        ))}

        {searchMode && (
          <View style={{ marginTop: 10 }}>
            {searchResults.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>user not found</Text>
              </View>
            ) : (
              searchResults.map(user => (
                <TouchableOpacity key={user.id} activeOpacity={0.9} onPress={() => handleCardTap(user)}>
                <View style={[
                  styles.userCard,
                  user.role === 'admin' ? styles.adminCard : user.role === 'walker' ? styles.walkerCard : styles.wandererCard,
                ]}>
                  <View style={styles.avatarRow}>
                    <View style={styles.avatarCircle}>
                      { getUserPhotoUrl(user as any) ? (
                        <Image
                          source={{ uri: getUserPhotoUrl(user as any) as string }}
                          style={styles.avatarImg}
                        />
                      ) : (
                        <MaterialIcons name="person" size={28} color="#666" />
                      )}
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.userCardName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </View>
                  <Text style={styles.userRole}>Role: {user.role}</Text>
                  <Text style={styles.userStatus}>
                    Status: {user.role === 'walker' ? (user.approved ? 'Approved' : 'Pending') : (user.approved ? 'Approved' : 'Pending')}
                  </Text>
                </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

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
                // Could navigate to admin profile if needed
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
              <Text style={styles.userName}>{userData?.name || 'Admin'}</Text>
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
                navigation.navigate('RemovedUsers');
              }}
            >
              <Text style={styles.drawerText}>Removed Users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('AuditLogs');
              }}
            >
              <Text style={styles.drawerText}>Audit Logs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('Analytics');
              }}
            >
              <Text style={styles.drawerText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('AdminPayments');
              }}
            >
              <Text style={styles.drawerText}>Payments</Text>
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

      {/* Removal Modal */}
      <Modal
        visible={removalModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRemovalModalVisible(false)}
      >
        <View style={styles.removalOverlay}>
          <View style={styles.removalCard}>
            <Text style={styles.removalTitle}>Remove this user?</Text>
            <TextInput
              style={styles.removalInput}
              placeholder="Write the removal reason…"
              placeholderTextColor="#333"
              value={removalReason}
              onChangeText={setRemovalReason}
              multiline
            />
            <View style={styles.removalActions}>
              <TouchableOpacity style={styles.removalCancel} onPress={() => setRemovalModalVisible(false)}>
                <Text style={styles.removalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removalConfirm}
                onPress={async () => {
                  if (!selectedUserForRemoval) return;
                  try {
                    await updateDoc(doc(db, 'users', selectedUserForRemoval.id), {
                      status: 'removed',
                      removedReason: removalReason || 'No reason specified',
                      removedAt: serverTimestamp(),
                      removedBy: (auth.currentUser && auth.currentUser.uid) || 'admin',
                    });
                    try {
                      await addDoc(collection(db, 'audit_logs'), {
                        actorId: auth.currentUser?.uid || 'admin',
                        action: 'user.remove',
                        targetType: 'user',
                        targetId: selectedUserForRemoval.id,
                        timestamp: serverTimestamp(),
                        reason: removalReason || 'No reason specified',
                        prev: { status: (selectedUserForRemoval as any).status || 'active' },
                        next: { status: 'removed' },
                      });
                    } catch (e) { /* ignore audit log failures */ }
                    setRemovalModalVisible(false);
                    setSelectedUserForRemoval(null);
                    setRemovalReason('');
                    fetchUsers();
                    Alert.alert('Removed', 'User has been marked as removed');
                  } catch (e) {
                    Alert.alert('Error', 'Failed to remove user');
                  }
                }}
              >
                <Text style={styles.removalConfirmText}>Remove user</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quiz Result Modal */}
      {quizResult && (
        <Modal
          visible={resultModal.visible}
          animationType="fade"
          transparent
          onRequestClose={() => setResultModal({ visible: false, userId: '' })}
        >
          <View style={styles.overlay}>
            <View style={styles.removalCard}>
              <ScrollView style={{ maxHeight: 470 }}>
                <Text style={[styles.resultTitle, {marginBottom:8}]}>Quiz Result</Text>
                <Text style={styles.resultScore}>Trust Index: <Text style={{fontWeight:'bold', color: quizResult.score >= 70 ? '#4CAF50' : '#CA2323'}}>{quizResult.score}/100</Text></Text>
                {quizResult?.traitScores && (
                  <View style={{marginBottom:18}}>
                    {Object.entries(quizResult.traitScores).map(([trait, val]) => (
                      <Text key={trait} style={styles.resultTrait}>{trait}: {Number(val).toFixed(2)}</Text>
                    ))}
                  </View>
                )}
                <Text style={styles.resultSub}>Answers:</Text>
                {quizResult.answers && Object.entries(quizResult.answers).map(([key, val], idx) => (
                  <Text key={key} style={styles.resultA}>{idx+1}. <Text style={{color:'#333',fontWeight:'700'}}>{val}</Text></Text>
                ))}
                <View style={{marginVertical:18, flexDirection:'row', justifyContent:'space-between'}}>
                  <TouchableOpacity style={[styles.quizActionBtn, {backgroundColor:'#4CAF50'}]} onPress={() => handleQuizApproveReject(resultModal.userId,true)}>
                    <Text style={{color:'#FFF', fontWeight:'700', fontSize:16}}>Pass</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.quizActionBtn, {backgroundColor:'#F44336'}]} onPress={() => handleQuizApproveReject(resultModal.userId,false)}>
                    <Text style={{color:'#FFF', fontWeight:'700', fontSize:16}}>Not Pass</Text>
                  </TouchableOpacity>
                </View>
                {!quizResult.score || quizResult.score < 60 ? (
                  <TextInput
                    style={styles.resultRejReason}
                    placeholder="Rejection Reason (optional)"
                    placeholderTextColor="#AAA"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                  />
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#000000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000000',
  },
  filterContainer: {
    position: 'relative',
    zIndex: 20,
  },
  filterButton: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    width: 160,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 30,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterOptionText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  roleSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    color: '#000000',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCard: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  adminCard: {
    backgroundColor: '#F2DAF4',
  },
  walkerCard: {
    backgroundColor: '#E8F6E9',
  },
  wandererCard: {
    backgroundColor: '#F7EDD9',
  },
  userCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000000',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  userStatus: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  moreDetails: {
    color: '#1E88E5',
    fontWeight: '700',
  },
  // Analytics Section
  analyticsSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  analyticsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  graphCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  graphContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 10,
  },
  yAxisContainer: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 5,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 20,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  graphPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphPlaceholderText: {
    fontSize: 14,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
  removalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  removalCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#E98181',
    padding: 20,
  },
  removalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  removalInput: {
    minHeight: 100,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    color: '#000000',
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  removalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  removalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  removalCancelText: {
    color: '#000000',
    fontWeight: '600',
  },
  removalConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  removalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Quiz Result Modal Styles
  resultTitle: { fontSize:18, fontWeight:'bold', marginTop:2, color:'#381' },
  resultScore: { fontSize:22, fontWeight:'800', marginVertical:7, color:'#212' },
  resultTrait: { color:'#612', fontWeight:'bold', marginBottom:2, fontSize:15 },
  resultSub: { fontWeight:'800', marginTop:7, marginBottom:3, color:'#111', fontSize:15 },
  resultA: { fontSize:15, color:'#434', marginBottom:5, fontWeight:'600' },
  quizActionBtn: { flex:1, marginHorizontal:5, paddingVertical:13, borderRadius:8, alignItems:'center' },
  resultRejReason: { borderColor:'#F44336', borderWidth:1, borderRadius:8, marginTop:9, minHeight:30, padding:8, color:'#B00020', fontWeight:'600', backgroundColor:'#FFFDEE' },
});

export default AdminDashboard;