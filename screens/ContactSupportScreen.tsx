import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

type ContactSupportScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { id: 'technical', label: 'Technical Issue', icon: 'bug-report' },
    { id: 'account', label: 'Account Help', icon: 'account-circle' },
    { id: 'safety', label: 'Safety Concern', icon: 'security' },
    { id: 'feedback', label: 'Feedback', icon: 'feedback' },
    { id: 'other', label: 'Other', icon: 'help' },
  ];

  const handleSubmit = () => {
    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a category for your inquiry.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Subject Required', 'Please enter a subject for your message.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter your message.');
      return;
    }

    // Here you would typically send the support request to your backend
    Alert.alert(
      'Support Request Sent',
      'Thank you for contacting us! Our support team will get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleEmailSupport = async () => {
    const email = 'support@movemates.com';
    const emailUrl = `mailto:${email}?subject=Support Request&body=`;
    
    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Unable to open email client');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email client');
    }
  };

  const handleCallSupport = async () => {
    const phoneNumber = '+1234567890';
    const phoneUrl = `tel:${phoneNumber}`;
    
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to make phone calls on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate call');
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
          <Text style={styles.headerTitle}>Contact Support</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          We're here to help! Send us a message and we'll get back to you as soon as possible.
        </Text>

        {/* Quick Contact Options */}
        <View style={styles.quickContactSection}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.quickContactRow}>
            <TouchableOpacity 
              style={styles.quickContactCard}
              onPress={handleEmailSupport}
              activeOpacity={0.7}
            >
              <MaterialIcons name="email" size={32} color="#5B21B6" />
              <Text style={styles.quickContactLabel}>Email Us</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickContactCard}
              onPress={handleCallSupport}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={32} color="#059669" />
              <Text style={styles.quickContactLabel}>Call Us</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Send a Message</Text>

          {/* Category Selection */}
          <Text style={styles.inputLabel}>Category *</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={category.icon as any}
                  size={20}
                  color={selectedCategory === category.id ? '#FFFFFF' : '#666666'}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id && styles.selectedCategoryButtonText,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject Input */}
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor="#999999"
          />

          {/* Message Input */}
          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Describe your issue or question in detail..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#999999"
          />

          {/* User Info Display */}
          <View style={styles.userInfoCard}>
            <MaterialIcons name="info" size={20} color="#3B82F6" />
            <Text style={styles.userInfoText}>
              Your account details will be automatically included to help us assist you better.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* Response Time Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="schedule" size={24} color="#F59E0B" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Response Time</Text>
            <Text style={styles.infoText}>
              We typically respond within 24 hours during business days.
            </Text>
          </View>
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
  quickContactSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickContactCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickContactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 10,
  },
  formSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategoryButton: {
    backgroundColor: '#5B21B6',
    borderColor: '#5B21B6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  messageInput: {
    minHeight: 140,
    paddingTop: 16,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  userInfoText: {
    fontSize: 12,
    color: '#0369A1',
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 18,
  },
});

export default ContactSupportScreen;
