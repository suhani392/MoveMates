import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { authService } from '../services/authService';
import { RootStackParamList } from '../App';
import DatePickerInput from '../components/DatePickerInput';

type ProfileDetailsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ProfileDetails'>;
  route: RouteProp<RootStackParamList, 'ProfileDetails'>;
};

const ProfileDetailsScreen: React.FC<ProfileDetailsScreenProps> = ({ navigation, route }) => {
  const { userData, selectedRole } = route.params;
  
  // Common fields for both roles
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [motherTongue, setMotherTongue] = useState('');
  const [preferredLanguages, setPreferredLanguages] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [altContactNo, setAltContactNo] = useState('');
  const [email, setEmail] = useState(userData.email || '');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [walkingPace, setWalkingPace] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [languages, setLanguages] = useState('');
  const [about, setAbout] = useState('');
  
  // Walker-specific fields
  const [altAddress, setAltAddress] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [experience, setExperience] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      // Handle new API (expo-document-picker v11+)
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        setDocuments([...documents, doc]);
        Alert.alert('Success', 'Document uploaded successfully');
      } else if (result.canceled) {
        // User cancelled
        console.log('Document picker cancelled');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    // Validation for common fields
    if (!dob || !gender || !motherTongue || !preferredLanguages || !contactNo || !email || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Walker-specific validation
    if (selectedRole === 'walker') {
      if (!aadharNo || !panNo || !pricePerHour || documents.length === 0) {
        Alert.alert('Error', 'Walkers must provide Aadhar, PAN, price, and upload at least one document');
        return;
      }
    }

    setIsLoading(true);

    // Create account with profile details
    const profileData = {
      name: `${userData.firstName} ${userData.lastName}`,
      phone: userData.phoneNumber,
      role: selectedRole,
      dob: dob.toISOString().split('T')[0], // Store as YYYY-MM-DD
      gender,
      motherTongue,
      preferredLanguage: preferredLanguages,
      contactNo,
      altContactNo: altContactNo || '',
      email,
      address,
      age: age ? parseInt(age) : undefined,
      walkingPace: walkingPace || '',
      hobbies: hobbies || '',
      languages: languages || '',
      about: about || '',
      ...(selectedRole === 'walker' && {
        altAddress: altAddress || '',
        aadharNo,
        panNo,
        pricePerHour: parseFloat(pricePerHour),
        experience: experience || '',
        documents: documents.map(doc => doc.name),
      }),
    };

    const result = await authService.signUp(
      userData.email,
      userData.password,
      profileData
    );

    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Account created! Please login.');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          {selectedRole === 'walker' 
            ? 'Tell us about yourself to help wanderers find the perfect walking companion'
            : 'Tell us about yourself to help us match you with the perfect walker'}
        </Text>

        <View style={styles.formContainer}>
          {/* Date of Birth */}
          <DatePickerInput
            label="Date of Birth"
            value={dob}
            onChange={setDob}
            placeholder="Select your date of birth"
            required
            maximumDate={new Date()}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
          <View style={styles.genderContainer}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mother Tongue */}
          <Text style={styles.label}>Mother Tongue <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={motherTongue}
            onChangeText={setMotherTongue}
            placeholder="e.g., Hindi, English, Marathi"
            placeholderTextColor="#999"
          />

          {/* Preferred Languages */}
          <Text style={styles.label}>Preferred Languages <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={preferredLanguages}
            onChangeText={setPreferredLanguages}
            placeholder="e.g., English, Hindi, Marathi"
            placeholderTextColor="#999"
          />

          {/* Contact Number */}
          <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={contactNo}
            onChangeText={setContactNo}
            placeholder="Enter your contact number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />

          {/* Alternate Contact Number */}
          <Text style={styles.label}>Alternate Contact Number</Text>
          <TextInput
            style={styles.input}
            value={altContactNo}
            onChangeText={setAltContactNo}
            placeholder="Enter alternate contact number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />

          {/* Email */}
          <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />

          {/* Address */}
          <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your full address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Age (Optional) */}
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter your age (optional)"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />

          {/* Walking Pace */}
          <Text style={styles.label}>Walking Pace <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={walkingPace}
            onChangeText={setWalkingPace}
            placeholder="e.g., Slow, Moderate, Fast"
            placeholderTextColor="#999"
          />

          {/* Hobbies */}
          <Text style={styles.label}>Hobbies <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={hobbies}
            onChangeText={setHobbies}
            placeholder="e.g., Reading, Photography, Music"
            placeholderTextColor="#999"
          />

          {/* Languages */}
          <Text style={styles.label}>Languages <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={languages}
            onChangeText={setLanguages}
            placeholder="e.g., English, Hindi, Marathi"
            placeholderTextColor="#999"
          />

          {/* About */}
          <Text style={styles.label}>About You <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={about}
            onChangeText={setAbout}
            placeholder="Tell us a bit about yourself..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Walker-specific fields */}
          {selectedRole === 'walker' && (
            <>
              {/* Alternate Address */}
              <Text style={styles.label}>Alternate Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={altAddress}
                onChangeText={setAltAddress}
                placeholder="Enter alternate address (optional)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Aadhar Number */}
              <Text style={styles.label}>Aadhar Number <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={aadharNo}
                onChangeText={setAadharNo}
                placeholder="Enter your 12-digit Aadhar number"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={12}
              />

              {/* PAN Number */}
              <Text style={styles.label}>PAN Number <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={panNo}
                onChangeText={setPanNo}
                placeholder="Enter your PAN number"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                maxLength={10}
              />

              {/* Experience */}
              <Text style={styles.label}>Experience</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={experience}
                onChangeText={setExperience}
                placeholder="Describe your walking/fitness experience..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Price Per Hour */}
              <Text style={styles.label}>Price Per Hour (₹) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={pricePerHour}
                onChangeText={setPricePerHour}
                placeholder="Enter your hourly rate"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />

              {/* Documents Upload */}
              <Text style={styles.label}>Upload Documents <Text style={styles.required}>*</Text> (ID Proof, Certificates)</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handleDocumentPick}>
                <MaterialIcons name="upload-file" size={24} color="#666" />
                <Text style={styles.uploadButtonText}>
                  {documents.length > 0 ? `${documents.length} document(s) uploaded` : 'Upload Documents'}
                </Text>
              </TouchableOpacity>

              {documents.length > 0 && (
                <View style={styles.documentsList}>
                  <Text style={styles.documentsTitle}>Uploaded Documents:</Text>
                  {documents.map((doc, index) => (
                    <View key={index} style={styles.documentItem}>
                      <MaterialIcons name="insert-drive-file" size={20} color="#4CAF50" />
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{doc.name}</Text>
                        <Text style={styles.documentSize}>{doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : 'Unknown size'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => {
                        const newDocs = documents.filter((_, i) => i !== index);
                        setDocuments(newDocs);
                      }}>
                        <MaterialIcons name="close" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 30,
    lineHeight: 22,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
    fontWeight: '500',
  },
  required: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#D9D9D9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#000000',
  },
  textArea: {
    borderRadius: 20,
    paddingTop: 16,
    minHeight: 100,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#D9D9D9',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  genderButtonSelected: {
    backgroundColor: '#000000',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  uploadButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  documentsList: {
    marginBottom: 20,
    backgroundColor: '#F0F8FF',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 10,
  },
  documentName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileDetailsScreen;
