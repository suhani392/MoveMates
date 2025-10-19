import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  timestamp?: any;
  reason?: string;
  prev?: any;
  next?: any;
}

const AuditLogsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const qy = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(qy);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setLogs(list);
      setError(null);
    } catch (e: any) {
      setError('Failed to load audit logs');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchLogs();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('approve')) return { name: 'checkmark-circle', color: '#4CAF50' };
    if (action.includes('reject')) return { name: 'close-circle', color: '#F44336' };
    if (action.includes('remove')) return { name: 'trash', color: '#D32F2F' };
    if (action.includes('create') || action.includes('add')) return { name: 'add-circle', color: '#2196F3' };
    if (action.includes('update') || action.includes('edit')) return { name: 'create', color: '#FF9800' };
    if (action.includes('delete')) return { name: 'trash', color: '#D32F2F' };
    return { name: 'information-circle', color: '#666' };
  };

  const formatAction = (action: string) => {
    return action.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp?.seconds) return 'Unknown time';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: AuditLog }) => {
    const iconData = getActionIcon(item.action);
    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconData.color + '20' }]}>
            <Ionicons name={iconData.name as any} size={24} color={iconData.color} />
          </View>
          <View style={styles.logHeaderText}>
            <Text style={styles.logAction}>{formatAction(item.action)}</Text>
            <Text style={styles.logTime}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>
        
        <View style={styles.logDetails}>
          {item.targetType && (
            <View style={styles.detailRow}>
              <MaterialIcons name="label" size={16} color="#666" />
              <Text style={styles.detailLabel}>Target Type:</Text>
              <Text style={styles.detailValue}>{item.targetType}</Text>
            </View>
          )}
          {item.targetId && (
            <View style={styles.detailRow}>
              <MaterialIcons name="fingerprint" size={16} color="#666" />
              <Text style={styles.detailLabel}>Target ID:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{item.targetId.slice(0, 20)}...</Text>
            </View>
          )}
          {item.actorId && (
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={16} color="#666" />
              <Text style={styles.detailLabel}>Actor ID:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{item.actorId.slice(0, 20)}...</Text>
            </View>
          )}
          {item.reason && (
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <MaterialIcons name="comment" size={16} color="#666" style={{ marginTop: 2 }} />
              <Text style={styles.detailLabel}>Reason:</Text>
              <Text style={[styles.detailValue, { flex: 1 }]}>{item.reason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Logs</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <View style={styles.loader}><ActivityIndicator color="#000" /></View>
      ) : error ? (
        <View style={styles.loader}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <FlatList
          data={logs}
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
              <Ionicons name="document-text-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Audit Logs Yet</Text>
              <Text style={styles.emptySubtitle}>Admin actions will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { height: 56, backgroundColor: 'rgba(0,0,0,0.8)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logHeaderText: {
    flex: 1,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 13,
    color: '#666',
  },
  logDetails: {
    gap: 8,
    paddingLeft: 60,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
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
  errorText: { color: '#D32F2F', fontWeight: '700', fontSize: 16 },
});

export default AuditLogsScreen;
