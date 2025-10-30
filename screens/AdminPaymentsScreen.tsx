import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Share,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PaymentRecord } from '../services/paymentService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type AdminPaymentsScreenProps = {
  navigation: StackNavigationProp<any>;
};

type FilterStatus = 'all' | 'pending' | 'paid' | 'failed' | 'disputed';

const AdminPaymentsScreen: React.FC<AdminPaymentsScreenProps> = ({ navigation }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalWalkerEarnings, setTotalWalkerEarnings] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, startDate, endDate, minAmount, maxAmount]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const paymentsList = snapshot.docs.map(doc => doc.data() as PaymentRecord);
      setPayments(paymentsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      Alert.alert('Error', 'Failed to load payments');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => {
        const paymentDate = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return paymentDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => {
        const paymentDate = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return paymentDate <= end;
      });
    }

    // Amount range filter
    if (minAmount) {
      const min = parseFloat(minAmount);
      filtered = filtered.filter(p => p.totalPayable >= min);
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount);
      filtered = filtered.filter(p => p.totalPayable <= max);
    }

    setFilteredPayments(filtered);

    // Calculate stats
    const revenue = filtered.reduce((sum, p) => sum + (p.status === 'paid' ? p.totalPayable : 0), 0);
    const commission = filtered.reduce((sum, p) => sum + (p.status === 'paid' ? p.commission : 0), 0);
    const walkerEarnings = filtered.reduce((sum, p) => sum + (p.status === 'paid' ? p.walkerEarnings : 0), 0);

    setTotalRevenue(revenue);
    setTotalCommission(commission);
    setTotalWalkerEarnings(walkerEarnings);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
  };

  const exportToCSV = async () => {
    try {
      // Create CSV header
      const header = 'Payment ID,Request ID,Wanderer ID,Walker ID,Date,Method,Status,Distance (km),Duration (min),Base Fare,Time Charge,Distance Charge,Subtotal,Commission,Tip,Total,Walker Earnings,Txn ID\n';

      // Create CSV rows
      const rows = filteredPayments.map(p => {
        const date = p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : new Date(p.createdAt).toISOString();
        const distanceKm = (p.distanceMeters / 1000).toFixed(2);
        const txnId = p.upi?.txnId || p.cash?.collectorConfirm ? 'Cash' : 'N/A';

        return `${p.id},${p.requestId},${p.wandererId},${p.walkerId},${date},${p.method},${p.status},${distanceKm},${p.durationMinutes},${p.baseFare},${p.fare - p.baseFare - Math.round(p.perKm * (p.distanceMeters / 1000))},${Math.round(p.perKm * (p.distanceMeters / 1000))},${p.fare},${p.commission},${p.tip},${p.totalPayable},${p.walkerEarnings},${txnId}`;
      }).join('\n');

      const csv = header + rows;

      // Save to file
      const fileName = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Payments',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Success', `CSV saved to ${fileUri}`);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'disputed': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>₹{totalRevenue.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Commission</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>₹{totalCommission.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Walker Earnings</Text>
          <Text style={[styles.statValue, { color: '#6366F1' }]}>₹{totalWalkerEarnings.toFixed(2)}</Text>
        </View>
      </View>

      {/* Export Button */}
      <View style={styles.exportContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
          <MaterialIcons name="file-download" size={20} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>
        <Text style={styles.resultCount}>{filteredPayments.length} payments</Text>
      </View>

      {/* Payments List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="payment" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No payments found</Text>
          </View>
        ) : (
          filteredPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View>
                  <Text style={styles.paymentId}>#{payment.id.substring(0, 8)}</Text>
                  <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                  <Text style={styles.statusText}>{payment.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{payment.method.toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Distance:</Text>
                  <Text style={styles.detailValue}>{(payment.distanceMeters / 1000).toFixed(2)} km</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{payment.durationMinutes} min</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fare:</Text>
                  <Text style={styles.detailValue}>₹{payment.fare}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Commission:</Text>
                  <Text style={[styles.detailValue, { color: '#10B981' }]}>₹{payment.commission}</Text>
                </View>
                {payment.tip > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tip:</Text>
                    <Text style={styles.detailValue}>₹{payment.tip}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { fontWeight: '700' }]}>Total:</Text>
                  <Text style={[styles.detailValue, { fontWeight: '700', fontSize: 18 }]}>₹{payment.totalPayable}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Walker Earnings:</Text>
                  <Text style={[styles.detailValue, { color: '#6366F1' }]}>₹{payment.walkerEarnings}</Text>
                </View>

                {payment.upi && (
                  <View style={styles.upiInfo}>
                    <Text style={styles.upiLabel}>UPI: {payment.upi.payeeVpa}</Text>
                    {payment.upi.txnId && (
                      <Text style={styles.upiTxn}>Txn: {payment.upi.txnId}</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Payments</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Status Filter */}
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {(['all', 'pending', 'paid', 'failed', 'disputed'] as FilterStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      statusFilter === status && styles.statusButtonActive,
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        statusFilter === status && styles.statusButtonTextActive,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range */}
              <Text style={styles.filterLabel}>Date Range</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Start Date (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
              />
              <TextInput
                style={styles.filterInput}
                placeholder="End Date (YYYY-MM-DD)"
                value={endDate}
                onChangeText={setEndDate}
              />

              {/* Amount Range */}
              <Text style={styles.filterLabel}>Amount Range</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Min Amount"
                value={minAmount}
                onChangeText={setMinAmount}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Max Amount"
                value={maxAmount}
                onChangeText={setMaxAmount}
                keyboardType="numeric"
              />

              {/* Actions */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    clearFilters();
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  exportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  upiInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  upiLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  upiTxn: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AdminPaymentsScreen;
