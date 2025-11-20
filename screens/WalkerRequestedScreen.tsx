import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { auth } from '../firebaseConfig';
import { WalkRequestService } from '../services/walkRequestService';
import { scheduleWalkReminder } from '../services/reminderService';

type WalkerRequestedScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { walker?: any; scheduleData?: any } }, 'params'>;
};

const WalkerRequestedScreen: React.FC<WalkerRequestedScreenProps> = ({ navigation, route }) => {
  const walker = route.params?.walker;
  const scheduleData = route.params?.scheduleData;
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    createWalkRequest();
  }, []);

  const createWalkRequest = async () => {
    console.log('Walker data:', walker);
    console.log('Schedule data:', scheduleData);
    
    if (!walker || !scheduleData) {
      Alert.alert('Error', `Missing data - Walker: ${!!walker}, Schedule: ${!!scheduleData}`);
      navigation.goBack();
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      console.log('Walker object:', walker);
      console.log('Walker image:', walker.image);
      console.log('Walker profileImage:', walker.profileImage);
      
      const requestData = {
        wandererId: user.uid,
        wandererName: scheduleData.wandererName || 'Unknown Wanderer',
        wandererImage: user.photoURL || null, // Include wanderer's profile picture
        walkerId: walker.id,
        walkerName: walker.name,
        // Keep walkerImage excluded to reduce request size
        walkType: scheduleData.walkType || 'route',
        pickup: scheduleData.pickup || scheduleData.meetingPoint || '',
        destination: scheduleData.destination || '',
        meetingPoint: scheduleData.meetingPoint,
        scheduledDate: scheduleData.scheduledDate,
        scheduledTime: scheduleData.scheduledTime,
        preference: scheduleData.preference || 'Solo',
        reminder: scheduleData.reminder || 'None', // Include reminder
        pricePerHour: walker.pricePerHour,
        estimatedDuration: scheduleData.estimatedDuration,
        // Only include duration if it exists and is not undefined
        ...(scheduleData.duration && { duration: scheduleData.duration }),
        // Only include notes if it exists and is not undefined
        ...(scheduleData.notes && { notes: scheduleData.notes }),
      };

      console.log('Request data being saved:', requestData);
      const id = await WalkRequestService.createRequest(requestData);
      setRequestId(id);
      console.log('Walk request created successfully:', id);

      // Schedule reminder notification if reminder is set
      if (scheduleData.reminder && scheduleData.reminder !== 'None') {
        try {
          await scheduleWalkReminder(
            id,
            scheduleData.scheduledDate,
            scheduleData.scheduledTime,
            scheduleData.reminder,
            user.uid,
            walker.id,
            scheduleData.wandererName || 'Unknown Wanderer',
            walker.name,
            scheduleData.walkType,
            scheduleData.meetingPoint,
            scheduleData.pickup
          );
          console.log('Reminder scheduled successfully');
        } catch (error) {
          console.error('Error scheduling reminder:', error);
          // Don't show error to user, reminder is not critical
        }
      }
    } catch (error) {
      console.error('Error creating walk request:', error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    // Reset navigation stack and go to RequestWalk (Wanderer home)
    navigation.reset({
      index: 0,
      routes: [{ name: 'RequestWalk' }],
    });
  };

  const handleCancelRequest = async () => {
    if (!requestId) {
      Alert.alert('Error', 'No request to cancel');
      return;
    }

    try {
      await WalkRequestService.cancelRequest(requestId);
      Alert.alert('Success', 'Request cancelled successfully');
      // Reset navigation stack and go to RequestWalk (Wanderer home)
      navigation.reset({
        index: 0,
        routes: [{ name: 'RequestWalk' }],
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert('Error', 'Failed to cancel request. Please try again.');
    }
  };

  const handleBack = () => {
    // Reset navigation stack and go to RequestWalk (Wanderer home)
    navigation.reset({
      index: 0,
      routes: [{ name: 'RequestWalk' }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 32 }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Walker Requested</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.topContent}>

          {/* Success Message Card */}
          <View style={styles.successCard}>
            <View style={styles.checkIconContainer}>
              <MaterialIcons name="check" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.successTextContainer}>
              <Text style={styles.successText}>
                Your request has been sent successfully to the walker!
              </Text>
            </View>
          </View>

          {/* Waiting Message */}
          <Text style={styles.waitingTitle}>
            Waiting for the walker to accept your request...
          </Text>

          {/* Info Text */}
          <Text style={styles.infoText}>
            We will notify you when the walker either accepts or declines the request you have sent.
          </Text>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          {/* Done Button */}
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>

          {/* Cancel Request Button */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelRequest}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
  },
  successCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  successTextContainer: {
    flex: 1,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 22,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 15,
    lineHeight: 26,
  },
  infoText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  bottomButtons: {
    paddingBottom: 20,
  },
  doneButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default WalkerRequestedScreen;
