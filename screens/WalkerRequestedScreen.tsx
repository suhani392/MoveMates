import React from 'react';
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

type WalkerRequestedScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { walker?: any; scheduleData?: any } }, 'params'>;
};

const WalkerRequestedScreen: React.FC<WalkerRequestedScreenProps> = ({ navigation, route }) => {
  const walker = route.params?.walker;
  const scheduleData = route.params?.scheduleData;

  const handleDone = () => {
    // Navigate back to home or walker list
    navigation.navigate('WandererHome');
  };

  const handleCancelRequest = () => {
    // TODO: Cancel the request in database
    console.log('Canceling request for walker:', walker?.id);
    // Navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topContent}>
          {/* Title */}
          <Text style={styles.title}>Walker Requested</Text>

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 30,
    textAlign: 'center',
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
