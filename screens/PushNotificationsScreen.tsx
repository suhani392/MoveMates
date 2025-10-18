import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type PushNotificationsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const PushNotificationsScreen: React.FC<PushNotificationsScreenProps> = ({ navigation }) => {
  const [allNotifications, setAllNotifications] = useState(true);
  const [walkRequests, setWalkRequests] = useState(true);
  const [walkAccepted, setWalkAccepted] = useState(true);
  const [walkCompleted, setWalkCompleted] = useState(true);
  const [messages, setMessages] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [updates, setUpdates] = useState(false);
  const [promotions, setPromotions] = useState(false);

  const handleToggleAll = (value: boolean) => {
    setAllNotifications(value);
    if (!value) {
      setWalkRequests(false);
      setWalkAccepted(false);
      setWalkCompleted(false);
      setMessages(false);
      setReminders(false);
      setUpdates(false);
      setPromotions(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Push Notifications</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Manage which notifications you want to receive
        </Text>

        {/* Master Toggle */}
        <View style={[styles.notificationCard, styles.masterCard]}>
          <View style={styles.notificationInfo}>
            <MaterialIcons name="notifications-active" size={24} color="#000000" />
            <View style={styles.notificationText}>
              <Text style={styles.notificationName}>All Notifications</Text>
              <Text style={styles.notificationDescription}>
                Enable or disable all push notifications
              </Text>
            </View>
          </View>
          <Switch
            value={allNotifications}
            onValueChange={handleToggleAll}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={allNotifications ? '#22C55E' : '#F3F4F6'}
          />
        </View>

        {/* Walk Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Walk Notifications</Text>
          
          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <MaterialIcons name="person-add" size={24} color="#5B21B6" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationName}>Walk Requests</Text>
                <Text style={styles.notificationDescription}>
                  New walk requests from wanderers
                </Text>
              </View>
            </View>
            <Switch
              value={walkRequests}
              onValueChange={setWalkRequests}
              disabled={!allNotifications}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={walkRequests ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <MaterialIcons name="check-circle" size={24} color="#059669" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationName}>Walk Accepted</Text>
                <Text style={styles.notificationDescription}>
                  When a walker accepts your request
                </Text>
              </View>
            </View>
            <Switch
              value={walkAccepted}
              onValueChange={setWalkAccepted}
              disabled={!allNotifications}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={walkAccepted ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <MaterialIcons name="done-all" size={24} color="#3B82F6" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationName}>Walk Completed</Text>
                <Text style={styles.notificationDescription}>
                  When a walk is marked as completed
                </Text>
              </View>
            </View>
            <Switch
              value={walkCompleted}
              onValueChange={setWalkCompleted}
              disabled={!allNotifications}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={walkCompleted ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Communication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>
          
          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <MaterialIcons name="chat" size={24} color="#EC4899" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationName}>Messages</Text>
                <Text style={styles.notificationDescription}>
                  New chat messages
                </Text>
              </View>
            </View>
            <Switch
              value={messages}
              onValueChange={setMessages}
              disabled={!allNotifications}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={messages ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <MaterialIcons name="alarm" size={24} color="#F59E0B" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationName}>Reminders</Text>
                <Text style={styles.notificationDescription}>
                  Upcoming walk reminders
                </Text>
              </View>
            </View>
            <Switch
              value={reminders}
              onValueChange={setReminders}
              disabled={!allNotifications}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={reminders ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Other Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other</Text>
          
          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <MaterialIcons name="new-releases" size={24} color="#6366F1" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationName}>App Updates</Text>
                <Text style={styles.notificationDescription}>
                  New features and improvements
                </Text>
              </View>
            </View>
            <Switch
              value={updates}
              onValueChange={setUpdates}
              disabled={!allNotifications}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={updates ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationInfo}>
              <MaterialIcons name="local-offer" size={24} color="#EF4444" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationName}>Promotions</Text>
                <Text style={styles.notificationDescription}>
                  Special offers and deals
                </Text>
              </View>
            </View>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              disabled={!allNotifications}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={promotions ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
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
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 25,
    lineHeight: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  masterCard: {
    backgroundColor: '#F7EDD9',
    marginBottom: 30,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  notificationText: {
    marginLeft: 15,
    flex: 1,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PushNotificationsScreen;
