import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const { width } = Dimensions.get('window');

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

  const dailySignups = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach(u => {
      const c = asDate(u.createdAt);
      if (!c || c < rangeStart) return;
      const key = formatDay(c);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [users, rangeStart]);

  const roleDistribution = useMemo(() => {
    const walker = users.filter(u => u.role === 'walker' && u.status !== 'removed').length;
    const wanderer = users.filter(u => u.role === 'wanderer' && u.status !== 'removed').length;
    const admin = users.filter(u => u.role === 'admin' && u.status !== 'removed').length;
    const total = walker + wanderer + admin;
    return { walker, wanderer, admin, total };
  }, [users]);

  const approvalStats = useMemo(() => {
    const walkers = users.filter(u => u.role === 'walker' && u.status !== 'removed');
    const approved = walkers.filter(u => u.approved).length;
    const pending = walkers.filter(u => !u.approved).length;
    return { approved, pending, total: walkers.length };
  }, [users]);

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#FFF', paddingTop: 32}}>
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

            {/* Role Distribution Pie Chart */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>User Distribution by Role</Text>
              <View style={styles.pieChartContainer}>
                {roleDistribution.total > 0 ? (
                  <>
                    <View style={styles.pieSegmentsRow}>
                      {roleDistribution.walker > 0 && (
                        <View style={[styles.pieSegment, { flex: roleDistribution.walker, backgroundColor: '#4CAF50' }]} />
                      )}
                      {roleDistribution.wanderer > 0 && (
                        <View style={[styles.pieSegment, { flex: roleDistribution.wanderer, backgroundColor: '#FF9800' }]} />
                      )}
                      {roleDistribution.admin > 0 && (
                        <View style={[styles.pieSegment, { flex: roleDistribution.admin, backgroundColor: '#9C27B0' }]} />
                      )}
                    </View>
                    <View style={styles.pieLegend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.legendText}>Walkers: {roleDistribution.walker} ({Math.round(roleDistribution.walker / roleDistribution.total * 100)}%)</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                        <Text style={styles.legendText}>Wanderers: {roleDistribution.wanderer} ({Math.round(roleDistribution.wanderer / roleDistribution.total * 100)}%)</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#9C27B0' }]} />
                        <Text style={styles.legendText}>Admins: {roleDistribution.admin} ({Math.round(roleDistribution.admin / roleDistribution.total * 100)}%)</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={styles.subtle}>No users found</Text>
                )}
              </View>
            </View>

            {/* Walker Approval Status */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Walker Approval Status</Text>
              <View style={styles.approvalBarsContainer}>
                <View style={styles.approvalBarRow}>
                  <Text style={styles.approvalLabel}>Approved</Text>
                  <View style={styles.approvalBarBg}>
                    <View style={[styles.approvalBarFill, { width: `${approvalStats.total > 0 ? (approvalStats.approved / approvalStats.total * 100) : 0}%`, backgroundColor: '#4CAF50' }]} />
                  </View>
                  <Text style={styles.approvalValue}>{approvalStats.approved}</Text>
                </View>
                <View style={styles.approvalBarRow}>
                  <Text style={styles.approvalLabel}>Pending</Text>
                  <View style={styles.approvalBarBg}>
                    <View style={[styles.approvalBarFill, { width: `${approvalStats.total > 0 ? (approvalStats.pending / approvalStats.total * 100) : 0}%`, backgroundColor: '#FF9800' }]} />
                  </View>
                  <Text style={styles.approvalValue}>{approvalStats.pending}</Text>
                </View>
              </View>
            </View>

            {/* Daily Signups Bar Chart */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Signups (Last {rangeDays} days)</Text>
              {Object.keys(dailySignups).length === 0 ? (
                <Text style={styles.subtle}>No signups in range</Text>
              ) : (
                <View style={styles.barChartContainer}>
                  <View style={styles.barsRow}>
                    {Object.entries(dailySignups).sort(([a],[b]) => a.localeCompare(b)).map(([day, count]) => {
                      const maxCount = Math.max(...Object.values(dailySignups), 1);
                      const heightPercent = (count / maxCount) * 100;
                      return (
                        <View key={day} style={styles.barColumnSmall}>
                          <View style={styles.barWrapperSmall}>
                            <View style={[styles.barSmall, { height: `${heightPercent}%` }]}>
                              <Text style={styles.barLabelSmall}>{count}</Text>
                            </View>
                          </View>
                          <Text style={styles.barDateSmall}>{day.slice(5)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Approvals per day */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Walker Approvals per Day</Text>
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
  card: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 16 },
  cardTitle: { color: '#000', fontWeight: '800', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { color: '#333', fontWeight: '600' },
  rowValue: { color: '#000' },
  subtle: { color: '#666' },
  pieChartContainer: { marginTop: 12 },
  pieSegmentsRow: { flexDirection: 'row', height: 30, borderRadius: 15, overflow: 'hidden', marginBottom: 16 },
  pieSegment: { height: '100%' },
  pieLegend: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 8 },
  legendText: { color: '#333', fontSize: 13 },
  approvalBarsContainer: { marginTop: 12, gap: 12 },
  approvalBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  approvalLabel: { width: 70, color: '#333', fontWeight: '600', fontSize: 13 },
  approvalBarBg: { flex: 1, height: 24, backgroundColor: '#E0E0E0', borderRadius: 12, overflow: 'hidden' },
  approvalBarFill: { height: '100%', borderRadius: 12 },
  approvalValue: { width: 40, textAlign: 'right', color: '#000', fontWeight: '700' },
  barChartContainer: { marginTop: 12 },
  barsRow: { flexDirection: 'row', height: 150, alignItems: 'flex-end', gap: 4 },
  barColumnSmall: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barWrapperSmall: { width: '100%', height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barSmall: { width: '80%', backgroundColor: '#3B82F6', borderTopLeftRadius: 4, borderTopRightRadius: 4, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 2, minHeight: 15 },
  barLabelSmall: { fontSize: 9, fontWeight: '600', color: '#FFFFFF' },
  barDateSmall: { fontSize: 9, color: '#666', marginTop: 4, textAlign: 'center' },
});

export default AnalyticsScreen;
