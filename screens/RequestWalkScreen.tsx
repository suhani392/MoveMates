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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/authService';
import { collection, query, where, getDocs, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

type RequestWalkScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface WalkData {
  date: string;
  duration: number;
  walkCount: number;
}

const RequestWalkScreen: React.FC<RequestWalkScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const [caloriesBurnt, setCaloriesBurnt] = useState<number|null>(null);
  const [loadingCalories, setLoadingCalories] = useState(true);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [weeklyTarget, setWeeklyTarget] = useState(1500);
  const [tempTarget, setTempTarget] = useState('1500');

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

  useEffect(() => {
    const fetchCalories = async () => {
      setLoadingCalories(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          setCaloriesBurnt(0);
          setLoadingCalories(false);
          return;
        }
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const requestsRef = collection(db, 'walkRequests');
        // Walker
        const walkerQuery = query(
          requestsRef,
          where('walkerId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('completedAt','desc')
        );
        // Wanderer
        const wandererQuery = query(
          requestsRef,
          where('wandererId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('completedAt','desc')
        );
        const [walkerSnap, wandererSnap] = await Promise.all([
          getDocs(walkerQuery),
          getDocs(wandererQuery)
        ]);
        let distanceSum = 0;
        const useIfToday = (doc) => {
          const data = doc.data();
          const completedAt = data.completedAt?.toDate?.() || null;
          if (!completedAt) return false;
          return completedAt >= today && completedAt < tomorrow;
        };
        walkerSnap.forEach(doc => { if (useIfToday(doc)) { distanceSum += doc.data().totalDistance || 0; }});
        wandererSnap.forEach(doc => { if (useIfToday(doc)) { distanceSum += doc.data().totalDistance || 0; }});
        const weight = userData?.weight || 60;
        const calories = Math.round(weight * (distanceSum / 1000) * 0.57);
        setCaloriesBurnt(calories);
      } catch (e) {
        setCaloriesBurnt(0);
      } finally {
        setLoadingCalories(false);
      }
    };
    fetchCalories();
  }, [userData]);

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
      screen: 'HelpingHand',
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
      screen: 'ExploringWalk',
    },
    {
      title: 'Need a person to help you discover places for good things?',
      icon: 'place',
      color: '#9CCC65',
      bgColor: '#E8F6F4',
      screen: 'SuggestiveWalk',
    },
  ];


  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#FFF', paddingTop: 32}}>
      {/* Header with green color */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
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
        {/* Greeting Section */}
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

        {/* Stats Cards */}
        <Animated.View 
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Calories Burnt Card */}
          <View style={styles.statCard}>
            <MaterialIcons name="local-fire-department" size={32} color="#FFFFFF" />
            {loadingCalories ? (
              <Text style={styles.statValue}>...</Text>
            ) : (
              <Text style={styles.statValue}>{caloriesBurnt}</Text>
            )}
            <Text style={styles.statLabel}>{"Calories Burnt\nToday"}</Text>
          </View>

          {/* Weekly Target Card */}
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setShowTargetModal(true)}
            activeOpacity={0.9}
          >
            <MaterialIcons name="flag" size={32} color="#FFFFFF" />
            <Text style={styles.statValue}>{weeklyTarget}</Text>
            <Text style={styles.statLabel}>Target This{'\n'}Week</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Walk Type Section */}
        <Animated.View 
          style={[
            styles.walkTypeSection,
            {
              opacity: fadeAnim,
              marginBottom: 30, // Add some bottom margin to compensate for removed section
            },
          ]}
        >
          <Text style={[styles.sectionTitle, {marginTop: 24}]}>Choose walk type</Text>
          <Text style={{fontSize: 14, color: '#555', marginBottom: 17, marginLeft: 2}}>Choose an option which matches what type of walk would you like to go for today :)</Text>
          
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
        {/* Removed as per edit hint */}
      </ScrollView>

      {/* Walker Updates Button - Bottom Right */}
      <TouchableOpacity
        style={styles.walkerUpdatesButton}
        onPress={() => navigation.navigate('WalkerUpdates')}
        activeOpacity={0.8}
      >
        <Image source={require('../assets/walk.png')} style={{ width: 28, height: 28, tintColor: '#FFFFFF' }} />
      </TouchableOpacity>

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
                navigation.navigate('WalkersList');
              }}
            >
              <Text style={styles.drawerText}>Walkers</Text>
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

      {/* Weekly Target Modal */}
      <Modal
        visible={showTargetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTargetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Weekly Calorie Target</Text>
            <Text style={styles.modalSubtitle}>How many calories do you want to burn this week?</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={tempTarget}
                onChangeText={setTempTarget}
                keyboardType="number-pad"
                maxLength={5}
                selectTextOnFocus={true}
              />
              <Text style={styles.inputSuffix}>calories</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTargetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  const target = parseInt(tempTarget) || 0;
                  if (target > 0) {
                    setWeeklyTarget(target);
                    // Here you would typically save this to your backend
                    // await saveWeeklyTarget(user.uid, target);
                  }
                  setShowTargetModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Save Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button for Walker Updates */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('WalkerUpdates')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="directions-walk" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
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
    backgroundColor: '#3B82F6',
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
    paddingHorizontal: 25,
    paddingTop: 16, // was 30
    paddingBottom: 15,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF', // white
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF', // white
    textAlign: 'center',
    lineHeight: 18,
  },
  walkTypeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20, // was 22
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  wellnessContent: {
    alignItems: 'stretch',
  },
  wellnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartContainer: {
    marginTop: 10,
  },
  chartLegend: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 12,
    marginTop: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginTop: 10,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 5,
  },
  loader: {
    marginVertical: 20,
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
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    width: '100%',
    height: 56,
    backgroundColor: '#F9F9F9',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
    padding: 0,
  },
  inputSuffix: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,  // Increased from 30 to 80 to move it up and avoid navigation bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default RequestWalkScreen;
