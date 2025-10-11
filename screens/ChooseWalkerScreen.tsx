import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type ChooseWalkerScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface Walker {
  id: string;
  name: string;
  pace: string;
  price: number;
  rating: number;
  available: boolean;
  image?: string;
}

const ChooseWalkerScreen: React.FC<ChooseWalkerScreenProps> = ({ navigation }) => {
  const walkers: Walker[] = [
    {
      id: '1',
      name: 'Sahil Pranjale',
      pace: 'Moderate',
      price: 100,
      rating: 4.9,
      available: true,
    },
    {
      id: '2',
      name: 'Mitali Dombre',
      pace: 'Fast',
      price: 80,
      rating: 4.1,
      available: false,
    },
    {
      id: '3',
      name: 'Suhani Badhe',
      pace: 'Slow',
      price: 50,
      rating: 5.0,
      available: true,
    },
    {
      id: '4',
      name: 'Samruddhi Dhawade',
      pace: 'Slow',
      price: 50,
      rating: 3.9,
      available: true,
    },
  ];

  const renderWalkerCard = (walker: Walker) => {
    return (
      <View key={walker.id} style={styles.walkerCard}>
        <View style={styles.cardContent}>
          {/* Profile Image Placeholder */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <MaterialIcons name="person" size={60} color="#CCCCCC" />
            </View>
          </View>

          {/* Walker Info */}
          <View style={styles.walkerInfo}>
            <Text style={styles.walkerName}>{walker.name}</Text>
            <Text style={styles.walkerDetail}>Pace : {walker.pace}</Text>
            <Text style={styles.walkerDetail}>Price : Rs. {walker.price}/hour</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.ratingText}>{walker.rating}</Text>
            </View>
          </View>

          {/* Availability Badge */}
          <View style={styles.availabilityContainer}>
            <View style={[
              styles.availabilityBadge,
              walker.available ? styles.availableBadge : styles.unavailableBadge
            ]}>
              <Text style={styles.availabilityText}>
                {walker.available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose a Walker</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Choose a walker of your choice to enjoy your walk :
        </Text>

        {/* Walkers Section */}
        <Text style={styles.sectionTitle}>Walkers nearby :</Text>

        {/* Walker Cards */}
        {walkers.map((walker) => renderWalkerCard(walker))}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 25,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  walkerCard: {
    backgroundColor: '#E8F6E9',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walkerInfo: {
    flex: 1,
  },
  walkerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  walkerDetail: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 4,
  },
  availabilityContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  availabilityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  availableBadge: {
    backgroundColor: '#81C784',
  },
  unavailableBadge: {
    backgroundColor: '#E57373',
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
});

export default ChooseWalkerScreen;
