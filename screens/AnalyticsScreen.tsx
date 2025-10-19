import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const formatDay = (d: Date) => d.toISOString().slice(0, 10);

const AnalyticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [rangeDays, setRangeDays] = useState<number>(30);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rangeStart = useMemo(() => daysAgo(rangeDays), [rangeDays]);

  const asDate = (x: any | undefined): Date | undefined => {
    if (!x) return undefined;
    if (x instanceof Date) return x;
    if (x instanceof Timestamp) return x.toDate();
    if (typeof x?.seconds === 'number') return new Date(x.seconds * 1000);
    if (typeof x === 'number') return new Date(x);
    if (typeof x === 'string') {
      const d = new Date(x);
      if (!isNaN(d.getTime())) return d;
    }
    return undefined;
  };

  const activeByRole = useMemo(() => {
    const cutoff = rangeStart.getTime();
    let walker = 0, wanderer = 0, admin = 0;
    users.forEach(u => {
      const la = asDate(u.lastActiveAt)?.getTime();
      if (la && la >= cutoff) {
        if (u.role === 'walker') walker++;
        else if (u.role === 'wanderer') wanderer++;
        else if (u.role === 'admin') admin++;
      }
    });
    return { walker, wanderer, admin };
  }, [users, rangeStart]);

  const signupsInRange = useMemo(() => {
    const start = rangeStart.getTime();
    return users.filter(u => {
      const c = asDate(u.createdAt)?.getTime();
      return c && c >= start;
    }).length;
  }, [users, rangeStart]);

  const approvalsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach(u => {
      if (u.role !== 'walker') return;
      const a = asDate(u.approvedAt);
      if (!a) return;
      if (a < rangeStart) return;
      const key = formatDay(a);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [users, rangeStart]);

  const removalsInRange = useMemo(() => {
    const start = rangeStart.getTime();
    return users.filter(u => u.status === 'removed' && asDate(u.removedAt)?.getTime()! >= start).length;
  }, [users, rangeStart]);

  const approvalsTotalInRange = useMemo(() => Object.values(approvalsByDay).reduce((a, b) => a + b, 0), [approvalsByDay]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rangeRow}>
          <Text style={styles.rangeLabel}>Range:</Text>
          {[7, 14, 30, 60, 90].map(d => (
            <TouchableOpacity key={d} style={[styles.rangeBtn, rangeDays === d && styles.rangeBtnActive]} onPress={() => setRangeDays(d)}>
              <Text style={[styles.rangeBtnText, rangeDays === d && styles.rangeBtnTextActive]}>{d}d</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>Active last {rangeDays}d</Text>
                <Text style={styles.kpiValue}>Walkers: {activeByRole.walker}</Text>
                <Text style={styles.kpiValue}>Wanderers: {activeByRole.wanderer}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>New signups</Text>
                <Text style={styles.kpiBig}>{signupsInRange}</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>Walker approvals</Text>
                <Text style={styles.kpiBig}>{approvalsTotalInRange}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>Removals</Text>
                <Text style={styles.kpiBig}>{removalsInRange}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Approvals per day</Text>
              {Object.keys(approvalsByDay).length === 0 ? (
                <Text style={styles.subtle}>No approvals in range</Text>
              ) : (
                Object.entries(approvalsByDay).sort(([a],[b]) => a.localeCompare(b)).map(([day, count]) => (
                  <View key={day} style={styles.row}>
                    <Text style={styles.rowLabel}>{day}</Text>
                    <Text style={styles.rowValue}>{count}</Text>
                  </View>
                ))
              )}
            </View>

            {/* CSV export can be added on selected tables later */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 56, backgroundColor: 'rgba(0,0,0,0.8)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  content: { padding: 16 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rangeLabel: { marginRight: 8, color: '#000', fontWeight: '700' },
  rangeBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EEE', borderRadius: 8, marginRight: 6 },
  rangeBtnActive: { backgroundColor: '#1E88E5' },
  rangeBtnText: { color: '#000', fontWeight: '700' },
  rangeBtnTextActive: { color: '#FFF' },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12 },
  kpiTitle: { color: '#000', fontWeight: '800' },
  kpiValue: { color: '#000', marginTop: 6 },
  kpiBig: { color: '#000', marginTop: 6, fontSize: 24, fontWeight: '900' },
  card: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12 },
  cardTitle: { color: '#000', fontWeight: '800', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { color: '#333', fontWeight: '600' },
  rowValue: { color: '#000' },
  subtle: { color: '#666' },
});

export default AnalyticsScreen;
