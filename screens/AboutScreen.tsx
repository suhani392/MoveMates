import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type AboutScreenProps = {
  navigation: StackNavigationProp<any>;
};

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const handleContactPress = () => {
    Linking.openURL('mailto:movematesofficial@gmail.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>MoveMates</Text>

        {/* Tagline */}
        <View style={styles.section}>
          <Text style={styles.tagline}>Your Companion for Every Walk</Text>
        </View>

        {/* Mission Statement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            MoveMates connects people who love walking with those who need companionship. 
            Whether you're looking for a walking buddy or want to help others stay active, 
            we make it easy to find the perfect match for safe, enjoyable walks together.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How It Helps You</Text>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Find trusted walking companions in your area</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Stay active and healthy with regular walks</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Build meaningful connections in your community</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Flexible scheduling to fit your lifestyle</Text>
          </View>
        </View>

        {/* Development Team */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About the Team</Text>
          <Text style={styles.cardText}>
            MoveMates is developed by a passionate team dedicated to promoting health, 
            wellness, and community connections. We believe that walking together creates 
            stronger, healthier communities.
          </Text>
        </View>

        {/* Version Info */}
        <View style={styles.versionCard}>
          <Text style={styles.versionText}>Version 1.0</Text>
          <Text style={styles.versionSubtext}>Released 2025</Text>
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackCard}>
          <MaterialIcons name="feedback" size={32} color="#666" />
          <Text style={styles.feedbackTitle}>We'd Love to Hear From You!</Text>
          <Text style={styles.feedbackText}>
            Your feedback helps us improve MoveMates. If you have suggestions, questions, 
            or just want to say hello, please reach out to us.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactPress}>
            <MaterialIcons name="email" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2025 MoveMates. All rights reserved.</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 15,
    color: '#333333',
    marginLeft: 10,
    flex: 1,
    lineHeight: 22,
  },
  versionCard: {
    backgroundColor: '#E8F6E9',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  feedbackCard: {
    backgroundColor: '#F7EDD9',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default AboutScreen;
