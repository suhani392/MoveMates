import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
}

const AuditLogsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const qy = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(qy);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setLogs(list);
        setError(null);
      } catch (e: any) {
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderItem = ({ item }: { item: AuditLog }) => (
    <View style={styles.item}>
      <Text style={styles.itemAction}>{item.action}</Text>
      <Text style={styles.itemMeta}>actor: {item.actorId} • target: {item.targetId || '-'} • {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString() : '-'}</Text>
      {item.reason ? <Text style={styles.itemReason}>reason: {item.reason}</Text> : null}
    </View>
  );

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
          ListEmptyComponent={<Text style={styles.subtle}>No logs yet. Perform an admin action like approve/reject/remove and come back.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 56, backgroundColor: 'rgba(0,0,0,0.8)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 12 },
  item: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 10 },
  itemAction: { color: '#000', fontWeight: '800', marginBottom: 6 },
  itemMeta: { color: '#333' },
  itemReason: { color: '#000', marginTop: 6 },
  subtle: { color: '#666', textAlign: 'center', marginTop: 20 },
  errorText: { color: '#D32F2F', fontWeight: '700' },
});

export default AuditLogsScreen;
