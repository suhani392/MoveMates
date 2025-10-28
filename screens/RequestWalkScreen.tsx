import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/authService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type RequestWalkScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RequestWalkScreen: React.FC<RequestWalkScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Listen for unread notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const unreadQuery = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setHasUnreadNotifications(!snapshot.empty);
    });

    return () => unsubscribe();
  }, []);

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openDrawer = () => {
    setMenuVisible(true);
  };

  const closeDrawer = () => {
    setMenuVisible(false);
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return t('goodMorning');
    } else if (hour < 17) {
      return t('goodAfternoon');
    } else {
      return t('goodEvening');
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
    };
    return now.toLocaleDateString('en-US', options);
  };

  const greeting = getGreeting();
  const currentDateTime = getCurrentDateTime();

  const walkOptions = [
    {
      title: 'Need a Helping hand?',
      icon: 'pan-tool',
      color: '#549553',
      bgColor: '#E8F6E9',
      screen: 'NearbyWalk',
    },
    {
      title: 'Need a Companion for Garden Walk?',
      icon: 'park',
      color: '#7CB342',
      bgColor: '#F8EDD9',
      screen: 'NearbyWalk',
    },
    {
      title: 'Need a companion for going somewhere?',
      icon: 'directions-walk',
      color: '#66BB6A',
      bgColor: '#D9DFF7',
      screen: 'RouteWalk',
    },
    {
      title: 'Need to explore areas?',
      icon: 'explore',
      color: '#81C784',
      bgColor: '#F6E8E8',
      screen: 'NearbyWalk',
    },
    {
      title: 'Need a person to help you discover places for good things?',
      icon: 'place',
      color: '#9CCC65',
      bgColor: '#E8F6F4',
      screen: 'NearbyWalk',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with green color */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.appName}>MOVEMATES</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialIcons name="notifications" size={28} color="#FFFFFF" />
          {hasUnreadNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting Section with Pastel Green Background */}
        <Animated.View 
          style={[
            styles.greetingSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.greetingText}>
            {greeting}, {userData?.name || 'User'}!
          </Text>
          <Text style={styles.dateTimeText}>
            {currentDateTime}
          </Text>
        </Animated.View>

        {/* Walk Type Section */}
        <Animated.View 
          style={[
            styles.walkTypeSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Choose Walk Type</Text>
          
          {walkOptions.map((option, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                style={[styles.walkCard, { backgroundColor: option.bgColor }]}
                onPress={() => navigation.navigate(option.screen as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.walkIconContainer, { backgroundColor: option.color + '20' }]}>
                  <MaterialIcons name={option.icon as any} size={28} color={option.color} />
                </View>
                <Text style={styles.walkCardTitle}>{option.title}</Text>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Wellness Footer Card */}
        <Animated.View 
          style={[
            styles.wellnessFooter,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.wellnessContent}>
            <View style={styles.wellnessIconContainer}>
              <MaterialIcons name="favorite" size={40} color="#81C784" />
            </View>
            <Text style={styles.wellnessTitle}>Wellness Walks for Mind & Heart</Text>
            <Text style={styles.wellnessSubtext}>
              Feeling low or motivated? Join supportive walks with trained companions.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Drawer */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={closeDrawer}
      >
        <View style={styles.overlay}>
          <View style={styles.drawer}>
            {/* Profile Header */}
            <TouchableOpacity 
              style={styles.profileHeader} 
              onPress={() => {
                closeDrawer();
                navigation.navigate('Profile');
              }}
            >
              <View style={styles.profileCircle}>
                {userData?.profileImage || userData?.image ? (
                  <Image
                    source={{ uri: (userData.profileImage || userData.image) }}
                    style={{ width: 70, height: 70, borderRadius: 35 }}
                  />
                ) : (
                  <MaterialIcons name="person" size={40} color="#666" />
                )}
              </View>
              <Text style={styles.drawerUserName}>{userData?.name || 'User Name'}</Text>
            </TouchableOpacity>

            {/* Menu Items */}
            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
              }}
            >
              <Text style={styles.drawerText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('Notifications');
              }}
            >
              <Text style={styles.drawerText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('ContactUs');
              }}
            >
              <Text style={styles.drawerText}>Contact Us</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('HelpPolicy');
              }}
            >
              <Text style={styles.drawerText}>Help & Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.drawerText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => { 
                closeDrawer();
                navigation.navigate('About');
              }}
            >
              <Text style={styles.drawerText}>About</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity 
              style={[styles.drawerItem, styles.logoutItem]} 
              onPress={() => { 
                closeDrawer();
                handleSignOut();
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
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
  },
  header: {
    backgroundColor: '#0A0A0A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  greetingSection: {
    backgroundColor: 'rgba(184, 235, 255, 0.7)',
    paddingHorizontal: 25,
    paddingVertical: 30,
    marginBottom: 25,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
  },
  walkTypeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  walkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  walkIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  walkCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 22,
  },
  wellnessFooter: {
    backgroundColor: '#C8E6C9',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  wellnessContent: {
    alignItems: 'center',
  },
  wellnessIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  wellnessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  wellnessSubtext: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Drawer
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  drawer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  profileCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  drawerUserName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  drawerItem: {
    marginBottom: 35,
  },
  drawerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutItem: {
    position: 'absolute',
    bottom: 50,
    left: 30,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '600',
  },
});

export default RequestWalkScreen;
