import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, query, where, updateDoc, doc, deleteField, Timestamp, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

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

const RemovedUsersScreen: React.FC<RemovedUsersScreenProps> = ({ navigation }) => {
  const [users, setUsers] = useState<RemovedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRemoved = async () => {
    try {
      const qref = query(collection(db, 'users'), where('status', '==', 'removed'));
      const snap = await getDocs(qref);
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as RemovedUser[];
      setUsers(list);
    } catch (e) {
      Alert.alert('Error', 'Failed to load removed users');
    }
  };

  useEffect(() => {
    (async () => {
      await fetchRemoved();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRemoved();
    setRefreshing(false);
  };

  const handleReinstate = async (userId: string, userName: string) => {
    Alert.alert(
      'Reinstate User',
      `Are you sure you want to reinstate ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reinstate',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', userId), {
                status: 'active',
                removedReason: deleteField(),
                removedAt: deleteField(),
                removedBy: deleteField(),
              });
              
              // Add audit log
              try {
                await addDoc(collection(db, 'audit_logs'), {
                  actorId: auth.currentUser?.uid || 'admin',
                  action: 'user.reinstate',
                  targetType: 'user',
                  targetId: userId,
                  timestamp: serverTimestamp(),
                });
              } catch (e) { /* ignore audit log failures */ }
              
              Alert.alert('Success', 'User reinstated successfully');
              fetchRemoved();
            } catch (e) {
              Alert.alert('Error', 'Failed to reinstate user');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role?: string) => {
    if (role === 'walker') return '#4CAF50';
    if (role === 'wanderer') return '#FF9800';
    if (role === 'admin') return '#9C27B0';
    return '#666';
  };

  const getRoleBgColor = (role?: string) => {
    if (role === 'walker') return '#E8F6E9';
    if (role === 'wanderer') return '#FFF3E0';
    if (role === 'admin') return '#F3E5F5';
    return '#F5F5F5';
  };

  const formatTimestamp = (timestamp?: Timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: RemovedUser }) => (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: getRoleBgColor(item.role) }]}>
          <MaterialIcons name="person-off" size={28} color={getRoleColor(item.role)} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <View style={styles.roleBadge}>
            <View style={[styles.roleDot, { backgroundColor: getRoleColor(item.role) }]} />
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={16} color="#666" />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{item.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={16} color="#666" />
          <Text style={styles.infoLabel}>Removed:</Text>
          <Text style={styles.infoValue}>{formatTimestamp(item.removedAt)}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text style={styles.infoLabel}>Removed By:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.removedBy ? item.removedBy.slice(0, 20) + '...' : 'N/A'}
          </Text>
        </View>

        {item.removedReason && (
          <View style={styles.reasonContainer}>
            <View style={styles.reasonHeader}>
              <MaterialIcons name="comment" size={16} color="#D32F2F" />
              <Text style={styles.reasonLabel}>Removal Reason:</Text>
            </View>
            <Text style={styles.reasonText}>{item.removedReason}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.reinstateButton}
          onPress={() => handleReinstate(item.id, item.name || 'this user')}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.reinstateButtonText}>Reinstate User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Removed Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Card */}
      {!loading && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={24} color="#D32F2F" />
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Removed Users</Text>
          </View>
        </View>
      )}

      {/* User List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading removed users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.emptyTitle}>No Removed Users</Text>
              <Text style={styles.emptySubtitle}>All users are currently active</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#D32F2F',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    minWidth: 90,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  reasonContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D32F2F',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D32F2F',
  },
  reasonText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  reinstateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reinstateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default RemovedUsersScreen;
