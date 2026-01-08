import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RequestAcceptedScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, 'RequestAccepted'> & {
    params: {
      wandererName: string;
      wandererId: string;
      wandererImage?: string;
      scheduledTime?: string;
      requestId: string;
    };
  };
};

const RequestAcceptedScreen: React.FC<RequestAcceptedScreenProps> = ({ navigation, route }) => {
  const { wandererName, wandererId, wandererImage, scheduledTime, requestId } = route.params;
  const [timeRemaining, setTimeRemaining] = useState('15 minutes');

  useEffect(() => {
    // Calculate time remaining if scheduledTime is provided
    if (scheduledTime) {
      // Parse scheduled time and calculate difference
      // For now, using placeholder
      setTimeRemaining('15 minutes');
    }
  }, [scheduledTime]);

  const handleChatWithWanderer = () => {
    navigation.navigate('Chat', {
      userId: wandererId,
      userName: wandererName,
      userImage: wandererImage,
      requestId,
    });
  };

  const handleGoBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'WalkerHome' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wanderer Request</Text>
      </View>

      {/* Success Message Card */}
      <View style={styles.successCard}>
        <View style={styles.checkIconContainer}>
          <MaterialIcons name="check-circle" size={48} color="#22C55E" />
        </View>
        <Text style={styles.successMessage}>
          Your acceptance has been sent successfully to the wanderer!
        </Text>
      </View>

      {/* Meeting Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Meet <Text style={styles.boldText}>{wandererName}</Text> at the pickup point in next{' '}
          <Text style={styles.boldText}>{timeRemaining}</Text>...
        </Text>
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Need to contact the wanderer?</Text>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChatWithWanderer}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonText}>Chat with Wanderer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  successCard: {
    backgroundColor: '#E8F6E9',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconContainer: {
    marginRight: 15,
  },
  successMessage: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 24,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 18,
    color: '#000000',
    lineHeight: 28,
  },
  boldText: {
    fontWeight: '700',
    color: '#000000',
  },
  contactSection: {
    paddingHorizontal: 20,
  },
  contactTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 15,
  },
  chatButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  chatButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default RequestAcceptedScreen;
