import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal, Animated, Easing } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../services/authService';

type WalkerHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

const WalkerHomeScreen: React.FC<WalkerHomeScreenProps> = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const openDrawer = () => {
    setMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Walker Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Your Status</Text>
            <TouchableOpacity
              style={[styles.toggleButton, isOnline && styles.toggleButtonActive]}
              onPress={() => setIsOnline(!isOnline)}
            >
              <Text style={[styles.toggleText, isOnline && styles.toggleTextActive]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.statusDescription}>
            {isOnline 
              ? 'You are available to receive walk requests' 
              : 'You are currently offline and won\'t receive new requests'
            }
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="directions-walk" size={30} color="#4CAF50" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Total Walks</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="star" size={30} color="#FF9800" />
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={30} color="#2196F3" />
            <Text style={styles.statNumber}>₹1,250</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestTime}>2:30 PM</Text>
              <View style={styles.requestStatus}>
                <Text style={styles.requestStatusText}>Pending</Text>
              </View>
            </View>
            <Text style={styles.requestLocation}>From: S3 Lifestyle Apartments</Text>
            <Text style={styles.requestLocation}>To: Rose Icon, Pimple Saudagar</Text>
            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineButton}>
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="schedule" size={24} color="#000000" />
              <Text style={styles.actionText}>Set Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="history" size={24} color="#000000" />
              <Text style={styles.actionText}>Walk History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="settings" size={24} color="#000000" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="help" size={24} color="#000000" />
              <Text style={styles.actionText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Navigation Drawer */}
      <Modal
        visible={menuVisible}
        animationType="none"
        transparent
        onRequestClose={closeDrawer}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={closeDrawer}
        >
          <Animated.View
            style={[
              styles.drawer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <TouchableOpacity 
              style={[styles.drawerItem, styles.profileHeader]} 
              onPress={() => {
                closeDrawer();
                navigation.navigate('Profile');
              }}
            >
              <Text style={styles.drawerProfile}>👤  Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // Refresh dashboard
              }}
            >
              <Text style={styles.drawerText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // Could navigate to settings
              }}
            >
              <Text style={styles.drawerText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // Could navigate to help
              }}
            >
              <Text style={styles.drawerText}>Help & Privacy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.drawerItem, styles.signOutItem]} 
              onPress={() => { 
                closeDrawer();
                handleSignOut();
              }}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSpacer: {
    width: 34, // Same width as menu button to center title
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  toggleButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
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
  requestCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  requestTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  requestStatus: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  requestStatusText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  requestLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: 15,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  actionText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
  },
  // Drawer styles
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 80,
    paddingHorizontal: 25,
  },
  drawerProfile: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 30,
  },
  drawerItem: {
    marginBottom: 25,
  },
  drawerText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '500',
  },
  signOutItem: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  signOutText: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

export default WalkerHomeScreen;