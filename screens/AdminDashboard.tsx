import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Modal, Animated, Easing } from 'react-native';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: any;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleApproveWalker = async (userId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { approved });
      Alert.alert('Success', `Walker ${approved ? 'approved' : 'rejected'}`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const openDrawer = () => {
    setMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading users...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Menu Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>User Management</Text>
        
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userStatus}>
              Status: {user.approved ? 'Approved' : 'Pending'}
            </Text>
            
            {user.role === 'walker' && (
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
                  disabled={!user.approved}
                >
                  <Text style={styles.buttonText}>
                    {user.approved ? 'Reject' : 'Rejected'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Navigation Drawer */}
      <Modal
        visible={menuVisible}
        animationType="none"
        transparent
        onRequestClose={closeDrawer}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={closeDrawer}
        >
          <Animated.View
            style={[
              styles.drawer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <TouchableOpacity 
              style={[styles.drawerItem, styles.profileHeader]} 
              onPress={() => {
                closeDrawer();
                // Could navigate to admin profile if needed
              }}
            >
              <Text style={styles.drawerProfile}>👤  Admin Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                fetchUsers(); // Refresh users
              }}
            >
              <Text style={styles.drawerText}>Refresh Users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // Could navigate to settings
              }}
            >
              <Text style={styles.drawerText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // Could navigate to help
              }}
            >
              <Text style={styles.drawerText}>Help & Privacy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.drawerItem, styles.signOutItem]} 
              onPress={() => { 
                closeDrawer();
                handleSignOut();
              }}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSpacer: {
    width: 34, // Same width as menu button to center title
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
  userCard: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  userName: {
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
  // Drawer styles
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 80,
    paddingHorizontal: 25,
  },
  drawerProfile: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 30,
  },
  drawerItem: {
    marginBottom: 25,
  },
  drawerText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '500',
  },
  signOutItem: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  signOutText: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

export default AdminDashboard;