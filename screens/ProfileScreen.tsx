import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type ProfileScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Suhani Vaibhav Badhe',
    role: 'Wanderer',
    about: 'I love exploring new places and making new friends.\nI am always up for a walk, at any time..!!',
    languages: 'Marathi, Hindi, English, German',
    pace: 'Moderate',
    hobbies: 'Playing instruments, Singing, Dancing, Drawing & Crafting, Planting, Listening to music, Coding & Development, Foodie',
  });

  const handleUpdate = () => {
    setIsEditing(false);
    console.log('Profile Updated:', userData);
  };

  const InfoSection = ({
    label,
    value,
    field,
    multiline = false,
  }: {
    label: string;
    value: string;
    field: string;
    multiline?: boolean;
  }) => (
    <View style={styles.infoSection}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={(text) => setUserData({ ...userData, [field]: text })}
          placeholder={`Enter your ${label.toLowerCase()}`}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      ) : (
        <Text style={styles.valueText}>{value}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.balancePlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={64} color="#666" />
            </View>
            {isEditing && (
              <TouchableOpacity style={styles.editPhotoButton}>
                <Ionicons name="pencil" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userRole}>{userData.role}</Text>
          <View style={styles.verifiedContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            <Text style={styles.verifiedText}>verified</Text>
          </View>
        </View>

        {/* Information Sections */}
        <View style={styles.infoContainer}>
          <InfoSection label="About" value={userData.about} field="about" multiline />
          <InfoSection label="Languages" value={userData.languages} field="languages" />
          <InfoSection label="Pace" value={userData.pace} field="pace" />
          <InfoSection label="Hobbies" value={userData.hobbies} field="hobbies" multiline />
        </View>
      </ScrollView>

      {/* Footer with conditional buttons */}
      <View style={styles.footer}>
        {isEditing ? (
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editPromptContainer}>
            <Text style={styles.editPromptText}>Need to edit your information?</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit my information</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  balancePlaceholder: {
    width: 44,
    height: 44,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  verifiedText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  valueText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  updateButton: {
    backgroundColor: '#000',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editPromptContainer: {
    alignItems: 'center',
  },
  editPromptText: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 4,
  },
  editButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen;
