import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, query, where, updateDoc, doc, deleteField, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface RemovedUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  removedReason?: string;
  removedAt?: Timestamp;
  removedBy?: string;
}

type RemovedUsersScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RemovedUsersScreen: React.FC<RemovedUsersScreenProps> = () => {
  const [users, setUsers] = useState<RemovedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRemoved = async () => {
    setLoading(true);
    try {
      const qref = query(collection(db, 'users'), where('status', '==', 'removed'));
      const snap = await getDocs(qref);
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as RemovedUser[];
      setUsers(list);
    } catch (e) {
      Alert.alert('Error', 'Failed to load removed users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemoved();
  }, []);

  const handleReinstate = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'active',
        removedReason: deleteField(),
        removedAt: deleteField(),
        removedBy: deleteField(),
      });
      Alert.alert('Success', 'User reinstated');
      fetchRemoved();
    } catch (e) {
      Alert.alert('Error', 'Failed to reinstate user');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Removed Users</Text>
        {loading ? (
          <Text style={styles.subtle}>Loading...</Text>
        ) : users.length === 0 ? (
          <Text style={styles.subtle}>No removed users</Text>
        ) : (
          users.map(u => (
            <View key={u.id} style={styles.card}>
              <Text style={styles.name}>{u.name || 'Unknown'}</Text>
              <Text style={styles.row}>Email: <Text style={styles.value}>{u.email || '-'}</Text></Text>
              <Text style={styles.row}>Role: <Text style={styles.value}>{u.role || '-'}</Text></Text>
              <Text style={styles.row}>Removed By: <Text style={styles.value}>{u.removedBy || '-'}</Text></Text>
              <Text style={styles.row}>Removed At: <Text style={styles.value}>{u.removedAt ? new Date(u.removedAt.toDate()).toLocaleString() : '-'}</Text></Text>
              <Text style={styles.row}>Reason:</Text>
              <Text style={styles.reason}>{u.removedReason || '-'}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.reinstateBtn} onPress={() => handleReinstate(u.id)}>
                  <Text style={styles.reinstateText}>Reinstate</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#000000', marginBottom: 16 },
  subtle: { color: '#666', marginTop: 10 },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '700', color: '#000000', marginBottom: 6 },
  row: { fontSize: 14, color: '#333', marginBottom: 2 },
  value: { fontWeight: '600', color: '#000' },
  reason: { fontSize: 14, color: '#000', marginTop: 6, lineHeight: 20 },
  actions: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  reinstateBtn: { backgroundColor: '#000000', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  reinstateText: { color: '#FFFFFF', fontWeight: '700' },
});

export default RemovedUsersScreen;
