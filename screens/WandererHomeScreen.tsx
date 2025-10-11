import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { authService } from '../services/authService';

type WandererHomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

const WandererHomeScreen: React.FC<WandererHomeScreenProps> = ({ navigation }) => {
  const [pickup, setPickup] = useState('S3 Lifestyle Apartments, Pimple Saudagar');
  const [destination, setDestination] = useState('Rose Icon, Pimple Saudagar');
  const [menuVisible, setMenuVisible] = useState(false);

  // Animation for drawer slide-in
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
      {/* Menu Button - hidden when drawer open */}
      {!menuVisible && (
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Bottom Card */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.bottomCard}>
          {/* Pickup */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pickup</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="my-location" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={pickup}
                onChangeText={setPickup}
                placeholder="Enter pickup location"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Destination */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Destination</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="place" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="Enter destination"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate('ScheduleDateTime')}
          >
            <Text style={styles.bookButtonText}>Book a Walker</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Drawer */}
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
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.drawerText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // navigation.navigate('Help');
              }}
            >
              <Text style={styles.drawerText}>Help & Privacy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                // navigation.navigate('Settings');
              }}
            >
              <Text style={styles.drawerText}>Settings</Text>
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
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: Platform.OS === 'ios' ? 25 : 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  bookButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Drawer
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

export default WandererHomeScreen;
