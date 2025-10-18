import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type WalkHistoryScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkHistoryItem {
  id: string;
  walkerId?: string;
  walkerName?: string;
  wandererId?: string;
  wandererName?: string;
  pickup: string;
  destination: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  completedAt?: any;
  createdAt: any;
}

const WalkHistoryScreen: React.FC<WalkHistoryScreenProps> = ({ navigation }) => {
  const [history, setHistory] = useState<WalkHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchWalkHistory();
  }, []);

  const fetchWalkHistory = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const requestsRef = collection(db, 'walkRequests');
      
      // Query for walks where user is either walker or wanderer
      const walkerQuery = query(
        requestsRef,
        where('walkerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const wandererQuery = query(
        requestsRef,
        where('wandererId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const [walkerSnapshot, wandererSnapshot] = await Promise.all([
        getDocs(walkerQuery),
        getDocs(wandererQuery),
      ]);

      const walks: WalkHistoryItem[] = [];
      
      walkerSnapshot.forEach((doc) => {
        walks.push({ id: doc.id, ...doc.data() } as WalkHistoryItem);
      });
      
      wandererSnapshot.forEach((doc) => {
        walks.push({ id: doc.id, ...doc.data() } as WalkHistoryItem);
      });

      // Sort by date
      walks.sort((a, b) => {
        const dateA = a.completedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
        const dateB = b.completedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setHistory(walks);
    } catch (error) {
      console.error('Error fetching walk history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    if (filter === 'all') return history;
    if (filter === 'completed') return history.filter(w => w.status === 'completed');
    if (filter === 'cancelled') return history.filter(w => w.status === 'declined' || w.status === 'cancelled');
    return history;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22C55E';
      case 'accepted':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      case 'declined':
      case 'cancelled':
        return '#EF4444';
      default:
        return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'accepted':
        return 'schedule';
      case 'pending':
        return 'hourglass-empty';
      case 'declined':
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const filteredHistory = getFilteredHistory();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Walk History</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'completed' && styles.activeFilterTab]}
            onPress={() => setFilter('completed')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'cancelled' && styles.activeFilterTab]}
            onPress={() => setFilter('cancelled')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'cancelled' && styles.activeFilterText]}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : filteredHistory.length > 0 ? (
          <View style={styles.historyList}>
            {filteredHistory.map((walk) => (
              <View key={walk.id} style={styles.historyCard}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(walk.status) }]}>
                  <MaterialIcons name={getStatusIcon(walk.status)} size={16} color="#FFFFFF" />
                  <Text style={styles.statusText}>{walk.status.toUpperCase()}</Text>
                </View>

                {/* Walk Info */}
                <View style={styles.walkInfo}>
                  <View style={styles.locationRow}>
                    <MaterialIcons name="place" size={20} color="#5B21B6" />
                    <View style={styles.locationText}>
                      <Text style={styles.locationLabel}>Pickup</Text>
                      <Text style={styles.locationValue}>{walk.pickup}</Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <MaterialIcons name="flag" size={20} color="#059669" />
                    <View style={styles.locationText}>
                      <Text style={styles.locationLabel}>Destination</Text>
                      <Text style={styles.locationValue}>{walk.destination}</Text>
                    </View>
                  </View>

                  <View style={styles.dateTimeRow}>
                    <MaterialIcons name="event" size={18} color="#666666" />
                    <Text style={styles.dateTimeText}>
                      {walk.scheduledDate} at {walk.scheduledTime}
                    </Text>
                  </View>

                  {/* Partner Info */}
                  {walk.walkerName && (
                    <View style={styles.partnerRow}>
                      <MaterialIcons name="person" size={18} color="#666666" />
                      <Text style={styles.partnerText}>
                        Walker: {walk.walkerName}
                      </Text>
                    </View>
                  )}
                  {walk.wandererName && (
                    <View style={styles.partnerRow}>
                      <MaterialIcons name="person" size={18} color="#666666" />
                      <Text style={styles.partnerText}>
                        Wanderer: {walk.wandererName}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>No walk history</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? 'Your walk history will appear here'
                : `No ${filter} walks found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  historyList: {
    marginBottom: 20,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  walkInfo: {
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  partnerText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default WalkHistoryScreen;
