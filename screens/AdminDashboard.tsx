import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Modal, Image } from 'react-native';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
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

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const { userData } = useAuth();
  const [showAdmins, setShowAdmins] = useState(true);
  const [showWalkers, setShowWalkers] = useState(true);
  const [showWanderers, setShowWanderers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  // No manual fetch for current admin profile; we rely on useAuth()

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
  };

  const closeDrawer = () => {
    setMenuVisible(false);
  };

  // Group users by role for sectioned display
  const admins = users.filter(u => u.role === 'admin');
  const walkers = users.filter(u => u.role === 'walker');
  const wanderers = users.filter(u => u.role === 'wanderer');

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
        <TouchableOpacity style={styles.headerButton} onPress={() => {
          // Navigate to notifications screen
          // navigation.navigate('Notifications');
        }}>
          <MaterialIcons name="notifications" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>User Management</Text>

        <TouchableOpacity style={styles.roleHeader} onPress={() => setShowAdmins(prev => !prev)}>
          <Text style={styles.roleSectionTitle}>Admins ({admins.length})</Text>
          <MaterialIcons name={showAdmins ? 'expand-less' : 'expand-more'} size={22} color="#000" />
        </TouchableOpacity>
        {showAdmins && admins.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <Text style={styles.userCardName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userStatus}>
              Status: {user.approved ? 'Approved' : 'Pending'}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={styles.roleHeader} onPress={() => setShowWalkers(prev => !prev)}>
          <Text style={styles.roleSectionTitle}>Walkers ({walkers.length})</Text>
          <MaterialIcons name={showWalkers ? 'expand-less' : 'expand-more'} size={22} color="#000" />
        </TouchableOpacity>
        {showWalkers && walkers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <Text style={styles.userCardName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userStatus}>
              Status: {user.approved ? 'Approved' : 'Pending'}
            </Text>
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
          </View>
        ))}

        <TouchableOpacity style={styles.roleHeader} onPress={() => setShowWanderers(prev => !prev)}>
          <Text style={styles.roleSectionTitle}>Wanderers ({wanderers.length})</Text>
          <MaterialIcons name={showWanderers ? 'expand-less' : 'expand-more'} size={22} color="#000" />
        </TouchableOpacity>
        {showWanderers && wanderers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <Text style={styles.userCardName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userStatus}>
              Status: {user.approved ? 'Approved' : 'Pending'}
            </Text>
          </View>
        ))}
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
                // navigation.navigate('Notifications');
              }}
            >
              <Text style={styles.drawerText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // navigation.navigate('ContactUs');
              }}
            >
              <Text style={styles.drawerText}>Contact Us</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // navigation.navigate('HelpPolicy');
              }}
            >
              <Text style={styles.drawerText}>Help & Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // navigation.navigate('Settings');
              }}
            >
              <Text style={styles.drawerText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // navigation.navigate('About');
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
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#000000',
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

export default AdminDashboard;