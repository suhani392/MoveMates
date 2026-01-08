import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type ContactUsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ContactUsScreen: React.FC<ContactUsScreenProps> = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:movematesofficial@gmail.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://aidkriya.com/');
  };

  const handleSocialPress = (platform: string, url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <MaterialIcons name="support-agent" size={48} color="#4CAF50" />
          <Text style={styles.welcomeTitle}>We're Here to Help!</Text>
          <Text style={styles.welcomeText}>
            Have questions, feedback, or need support? We'd love to hear from you! 
            Reach out to us through any of the channels below, and our team will get 
            back to you as soon as possible.
          </Text>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>

          {/* Email */}
          <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="email" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>movematesofficial@gmail.com</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity style={styles.contactCard} onPress={handlePhonePress}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="phone" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+1 (234) 567-890</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          {/* Website */}
          <TouchableOpacity style={styles.contactCard} onPress={handleWebsitePress}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="language" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>aidkriya.com</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          {/* Address */}
          <View style={styles.contactCard}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="location-on" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>123 Walking Street{'\n'}Health City, HC 12345</Text>
            </View>
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => handleSocialPress('LinkedIn', 'https://www.linkedin.com')}
            >
              <MaterialIcons name="business" size={32} color="#0077B5" />
              <Text style={styles.socialText}>LinkedIn</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => handleSocialPress('Instagram', 'https://www.instagram.com/aidkriya')}
            >
              <MaterialIcons name="photo-camera" size={32} color="#E4405F" />
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => handleSocialPress('Facebook', 'https://www.facebook.com')}
            >
              <MaterialIcons name="facebook" size={32} color="#1877F2" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => handleSocialPress('Twitter', 'https://www.twitter.com')}
            >
              <MaterialIcons name="chat" size={32} color="#1DA1F2" />
              <Text style={styles.socialText}>Twitter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyCard}>
          <MaterialIcons name="lock" size={24} color="#4CAF50" />
          <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
          <Text style={styles.privacyText}>
            We take your privacy seriously. Any information you share with us will remain 
            confidential and secure. We will never share your personal details with third 
            parties without your consent.
          </Text>
        </View>

        {/* Business Hours */}
        <View style={styles.hoursCard}>
          <Text style={styles.hoursTitle}>Business Hours</Text>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Monday - Friday</Text>
            <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Saturday</Text>
            <Text style={styles.hoursTime}>10:00 AM - 4:00 PM</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Sunday</Text>
            <Text style={styles.hoursTime}>Closed</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Developed by Team MoveMates</Text>
          <Text style={styles.footerSubtext}>© 2025 MoveMates. All rights reserved.</Text>
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
    paddingBottom: 40,
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
  welcomeCard: {
    backgroundColor: '#E8F6E9',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 15,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  socialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  socialButton: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 8,
  },
  privacyCard: {
    backgroundColor: '#D9DFF7',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    marginBottom: 10,
  },
  privacyText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 20,
  },
  hoursCard: {
    backgroundColor: '#F7EDD9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  hoursDay: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: 15,
    color: '#666666',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999999',
  },
});

export default ContactUsScreen;
