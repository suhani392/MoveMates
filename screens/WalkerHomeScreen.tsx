import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

type WalkerHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkRequest {
  id: string;
  name: string;
  rating: number;
  pace: string;
  pickup: string;
  destination: string;
  preference: string;
}

const WalkerHomeScreen: React.FC<WalkerHomeScreenProps> = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(true);

  // Mock data for incoming requests
  const incomingRequests: WalkRequest[] = [
    {
      id: '1',
      name: 'Suhani Badhe',
      rating: 4.9,
      pace: 'Slow',
      pickup: 'S3 Lifestyle Apartment',
      destination: 'Rose Icon',
      preference: 'Solo',
    },
    {
      id: '2',
      name: 'Atharva Gholap',
      rating: 4.5,
      pace: 'Fast',
      pickup: 'S3 Lifestyle Apartment',
      destination: 'Rose Icon',
      preference: 'Group',
    },
    {
      id: '3',
      name: 'Sushant Manel',
      rating: 4.0,
      pace: 'Moderate',
      pickup: 'S3 Lifestyle Apartment',
      destination: 'Rose Icon',
      preference: 'Pet',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Dark Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Walker Home</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>Hello, User!</Text>

        {/* Availability Toggle Card */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={styles.availabilityTextContainer}>
              <Text style={styles.availabilityTitle}>Available for a walk?</Text>
              <Text style={styles.availabilitySubtitle}>
                Let the wanderer's know if you are available for a walk at the moment
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isAvailable ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.purpleCard]}>
            <Ionicons name="walk" size={40} color="#000000" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>WALKS</Text>
          </View>
          <View style={[styles.statCard, styles.purpleCard]}>
            <MaterialIcons name="account-balance-wallet" size={40} color="#000000" />
            <Text style={styles.statNumber}>RS. 2780</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
        </View>

        {/* Incoming Requests */}
        <Text style={styles.sectionTitle}>Incoming Requests</Text>
        
        {incomingRequests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestAvatar}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFA500" />
                <Text style={styles.ratingText}>{request.rating}</Text>
              </View>
            </View>
            <View style={styles.requestDetails}>
              <Text style={styles.requestName}>{request.name}</Text>
              <Text style={styles.requestInfo}>Pace : {request.pace}</Text>
              <Text style={styles.requestInfo}>Pickup : {request.pickup}</Text>
              <Text style={styles.requestInfo}>Destination : {request.destination}</Text>
              <Text style={styles.requestInfo}>Preference : {request.preference}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation Icon */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.bottomNavButton}>
          <Ionicons name="walk" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D2D2D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: '#2D2D2D',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  availabilityCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  availabilitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  purpleCard: {
    backgroundColor: '#DDD6FE',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  requestAvatar: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginRight: 15,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  requestDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  requestInfo: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  bottomNavButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default WalkerHomeScreen;