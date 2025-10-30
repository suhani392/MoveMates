import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type WalkersListScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface Walker {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  walkingPace: string;
  pricePerHour: number;
  age: number;
  experience: string;
  languages: string;
  hobbies: string;
  about: string;
  approved: boolean;
  createdAt: any;
  role: string;
  image?: string;
  profileImage?: string;
  rating?: number;
  available?: boolean;
  isOnline?: boolean;
  currentWalkStatus?: 'idle' | 'busy' | 'offline';
}

const WalkersListScreen: React.FC<WalkersListScreenProps> = ({ navigation }) => {
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [filteredWalkers, setFilteredWalkers] = useState<Walker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Filter states
  const [selectedPace, setSelectedPace] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [minRating, setMinRating] = useState(0);

  // Fetch walkers from Firestore
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const walkersQuery = query(
      usersRef,
      where('role', '==', 'walker'),
      where('approved', '==', true)
    );

    const unsubscribe = onSnapshot(
      walkersQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const walkersList: Walker[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            uid: doc.id,
            ...doc.data(),
          } as Walker));
          setWalkers(walkersList);
          setFilteredWalkers(walkersList);
        } else {
          setWalkers([]);
          setFilteredWalkers([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching walkers:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle search and filters
  useEffect(() => {
    let filtered = [...walkers];

    // Apply search
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((walker) =>
        walker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        walker.languages?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        walker.walkingPace?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply pace filter
    if (selectedPace.length > 0) {
      filtered = filtered.filter((walker) =>
        selectedPace.some(pace => walker.walkingPace?.toLowerCase().includes(pace.toLowerCase()))
      );
    }

    // Apply language filter
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter((walker) =>
        selectedLanguages.some(lang => walker.languages?.toLowerCase().includes(lang.toLowerCase()))
      );
    }

    // Apply price range filter
    filtered = filtered.filter((walker) =>
      walker.pricePerHour && walker.pricePerHour >= priceRange.min && walker.pricePerHour <= priceRange.max
    );

    // Apply rating filter
    if (minRating > 0) {
      filtered = filtered.filter((walker) =>
        walker.rating && walker.rating >= minRating
      );
    }

    setFilteredWalkers(filtered);
  }, [searchQuery, walkers, selectedPace, selectedLanguages, priceRange, minRating]);

  const togglePaceFilter = (pace: string) => {
    setSelectedPace(prev =>
      prev.includes(pace) ? prev.filter(p => p !== pace) : [...prev, pace]
    );
  };

  const toggleLanguageFilter = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language) ? prev.filter(l => l !== language) : [...prev, language]
    );
  };

  const clearFilters = () => {
    setSelectedPace([]);
    setSelectedLanguages([]);
    setPriceRange({ min: 0, max: 1000 });
    setMinRating(0);
  };

  const hasActiveFilters = selectedPace.length > 0 || selectedLanguages.length > 0 || minRating > 0 || priceRange.min > 0 || priceRange.max < 1000;

  const renderWalkerCard = (walker: Walker) => {
    return (
      <TouchableOpacity
        key={walker.id}
        style={styles.walkerCard}
        onPress={() => navigation.navigate('WalkerProfile', { walkerId: walker.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            {walker.image || walker.profileImage ? (
              <Image
                source={{ uri: walker.image || walker.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="person" size={60} color="#CCCCCC" />
              </View>
            )}
          </View>

          {/* Walker Info */}
          <View style={styles.walkerDetails}>
            <Text style={styles.walkerName}>{walker.name}</Text>
            
            {walker.rating && (
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.ratingText}>{walker.rating.toFixed(1)}</Text>
              </View>
            )}

            <Text style={styles.walkerInfo} numberOfLines={1}>
              Pace: {walker.walkingPace || 'Moderate'}
            </Text>
            
            {walker.languages && (
              <Text style={styles.walkerInfo} numberOfLines={1}>
                Languages: {walker.languages}
              </Text>
            )}

            {walker.pricePerHour && (
              <Text style={styles.walkerInfo}>
                Rate: ₹{walker.pricePerHour}/hour
              </Text>
            )}
          </View>

          {/* Arrow Icon */}
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Walkers</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search walkers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFiltersModal(true)}
        >
          <MaterialIcons name="filter-list" size={24} color={hasActiveFilters ? "#FFFFFF" : "#666"} />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Walkers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading walkers...</Text>
        </View>
      ) : filteredWalkers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="person-off" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No walkers found' : 'No walkers available'}
          </Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsText}>
            {filteredWalkers.length} walker{filteredWalkers.length !== 1 ? 's' : ''} found
          </Text>
          {filteredWalkers.map(renderWalkerCard)}
        </ScrollView>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pace Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Walking Pace</Text>
                <View style={styles.filterOptions}>
                  {['Slow', 'Moderate', 'Fast'].map((pace) => (
                    <TouchableOpacity
                      key={pace}
                      style={[styles.filterChip, selectedPace.includes(pace) && styles.filterChipActive]}
                      onPress={() => togglePaceFilter(pace)}
                    >
                      <Text style={[styles.filterChipText, selectedPace.includes(pace) && styles.filterChipTextActive]}>
                        {pace}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Language Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Languages</Text>
                <View style={styles.filterOptions}>
                  {['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu'].map((language) => (
                    <TouchableOpacity
                      key={language}
                      style={[styles.filterChip, selectedLanguages.includes(language) && styles.filterChipActive]}
                      onPress={() => toggleLanguageFilter(language)}
                    >
                      <Text style={[styles.filterChipText, selectedLanguages.includes(language) && styles.filterChipTextActive]}>
                        {language}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range (₹/hour)</Text>
                <View style={styles.priceRangeContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    keyboardType="numeric"
                    value={priceRange.min.toString()}
                    onChangeText={(text) => setPriceRange({ ...priceRange, min: parseInt(text) || 0 })}
                  />
                  <Text style={styles.priceRangeSeparator}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    keyboardType="numeric"
                    value={priceRange.max.toString()}
                    onChangeText={(text) => setPriceRange({ ...priceRange, max: parseInt(text) || 1000 })}
                  />
                </View>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.ratingOptions}>
                  {[0, 3, 4, 4.5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[styles.ratingChip, minRating === rating && styles.filterChipActive]}
                      onPress={() => setMinRating(rating)}
                    >
                      <MaterialIcons name="star" size={16} color={minRating === rating ? "#FFFFFF" : "#FFC107"} />
                      <Text style={[styles.ratingChipText, minRating === rating && styles.filterChipTextActive]}>
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  clearFilters();
                  setShowFiltersModal(false);
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#000000',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultsText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },
  walkerCard: {
    backgroundColor: '#D9DFF7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walkerDetails: {
    flex: 1,
  },
  walkerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 4,
  },
  walkerInfo: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  priceRangeSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  ratingChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WalkersListScreen;
