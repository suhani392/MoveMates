import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type EditProfileScreenProps = {
  navigation: StackNavigationProp<any>;
};

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [languages, setLanguages] = useState('');
  const [walkingPace, setWalkingPace] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchUserData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
    }
  };

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || '');
          setAbout(data.about || '');
          setLanguages(data.languages || '');
          setWalkingPace(data.walkingPace || data.pace || '');
          setHobbies(data.hobbies || '');
          setAge(data.age?.toString() || '');
          setExperience(data.experience || '');
          setPricePerHour(data.pricePerHour?.toString() || '');
          setProfileImage(data.profileImage || data.image || null);
          setUserRole(data.role || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    setSaving(true);
    const user = auth.currentUser;
    
    if (user) {
      try {
        const updateData: any = {
          name: name.trim(),
          about: about.trim(),
          languages: languages.trim(),
          hobbies: hobbies.trim(),
        };

        // Add role-specific fields
        if (userRole === 'walker' || userRole === 'wanderer') {
          updateData.walkingPace = walkingPace.trim();
        }

        if (age) {
          updateData.age = parseInt(age);
        }

        // Walker-specific fields
        if (userRole === 'walker') {
          if (experience) {
            updateData.experience = experience.trim();
          }
          if (pricePerHour) {
            updateData.pricePerHour = parseFloat(pricePerHour);
          }
        }

        // Add profile image if changed: convert to base64 and store in Firestore
        if (profileImage && profileImage.startsWith('file')) {
          try {
            const response = await fetch(profileImage);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            updateData.profileImage = base64;
            updateData.updatedAt = Date.now();
          } catch (uploadError: any) {
            console.error('Image conversion error:', uploadError);
            // Continue without image if conversion fails
          }
        }

        await updateDoc(doc(db, 'users', user.uid), updateData);
        
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } catch (error: any) {
        console.error('Error updating profile:', error?.code || '', error?.message || '', error);
        Alert.alert('Error', 'Failed to update profile');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            <View style={styles.avatar}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <MaterialIcons name="person" size={80} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.editIconContainer}>
              <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          {/* About */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>About</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={about}
              onChangeText={setAbout}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Languages */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Languages</Text>
            <TextInput
              style={styles.input}
              value={languages}
              onChangeText={setLanguages}
              placeholder="e.g., English, Hindi, Marathi"
              placeholderTextColor="#999"
            />
          </View>

          {/* Walking Pace - Only for Walker and Wanderer */}
          {(userRole === 'walker' || userRole === 'wanderer') && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pace</Text>
              <TextInput
                style={styles.input}
                value={walkingPace}
                onChangeText={setWalkingPace}
                placeholder="e.g., Slow, Moderate, Fast"
                placeholderTextColor="#999"
              />
            </View>
          )}

          {/* Hobbies */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hobbies</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={hobbies}
              onChangeText={setHobbies}
              placeholder="e.g., Reading, Music, Photography"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Walker-specific fields */}
          {userRole === 'walker' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="Describe your experience..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price Per Hour (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={pricePerHour}
                  onChangeText={setPricePerHour}
                  placeholder="Enter hourly rate"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
