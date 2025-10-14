import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type ProfileScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Add focus listener to refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchUserData = async (isRefreshing = false) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isRefreshing) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    } else {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData(true);
  };

  const getRoleDisplayName = (role: string) => {
    if (role === 'wanderer') return 'Wanderer';
    if (role === 'walker') return 'Walker';
    if (role === 'admin') return 'Admin';
    return role;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Unable to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={80} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{userData.name || 'User Name'}</Text>
            <Text style={styles.userRole}>{getRoleDisplayName(userData.role)}</Text>
            <View style={styles.verifiedContainer}>
              <MaterialIcons name="verified" size={18} color="#3B82F6" />
              <Text style={styles.verifiedText}>verified</Text>
            </View>
          </View>
        </View>

        {/* Information Sections */}
        <View style={styles.infoContainer}>
          {/* About Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionContent}>
              {userData.about || 'No information provided.'}
            </Text>
          </View>

          {/* Languages Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.sectionContent}>
              {userData.languages || 'Not specified'}
            </Text>
          </View>

          {/* Pace Section - Only for Wanderers and Walkers */}
          {(userData.role === 'wanderer' || userData.role === 'walker') && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Pace</Text>
              <Text style={styles.sectionContent}>
                {userData.walkingPace || userData.pace || 'Not specified'}
              </Text>
            </View>
          )}

          {/* Hobbies Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Hobbies</Text>
            <Text style={styles.sectionContent}>
              {userData.hobbies || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Edit Prompt */}
        <View style={styles.editPromptContainer}>
          <Text style={styles.editPromptText}>Need to edit your information?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editButtonText}>Edit my information</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  editPromptContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  editPromptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  editButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileScreen;
