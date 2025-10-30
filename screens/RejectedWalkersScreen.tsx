import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  rejected: boolean;
  rejectionReason?: string;
  createdAt: any;
}

const RejectedWalkersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchRejectedWalkers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'walker'),
        where('rejected', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching rejected walkers:', error);
      Alert.alert('Error', 'Failed to fetch rejected walkers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReinstate = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        approved: false,
        rejected: false,
        rejectionReason: ''
      });
      
      // Refresh the list
      fetchRejectedWalkers();
      Alert.alert('Success', 'Walker has been reinstated and moved to pending approval');
    } catch (error) {
      console.error('Error reinstating walker:', error);
      Alert.alert('Error', 'Failed to reinstate walker');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRejectedWalkers();
  };

  useEffect(() => {
    fetchRejectedWalkers();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Rejected Walkers</Text>
      
      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="person-off" size={48} color="#999" />
          <Text style={styles.emptyText}>No rejected walkers found</Text>
        </View>
      ) : (
        users.map(user => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || 'Unnamed User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.rejectionReason && (
                <Text style={styles.rejectionReason}>
                  <Text style={styles.bold}>Reason: </Text>
                  {user.rejectionReason}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.reinstateButton}
              onPress={() => handleReinstate(user.id)}
            >
              <Text style={styles.reinstateButtonText}>Reinstate</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  rejectionReason: {
    fontSize: 13,
    color: '#d32f2f',
    fontStyle: 'italic',
    marginTop: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  reinstateButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 10,
  },
  reinstateButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default RejectedWalkersScreen;
