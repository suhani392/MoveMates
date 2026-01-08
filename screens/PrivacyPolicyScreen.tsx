import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type PrivacyPolicyScreenProps = {
  navigation: StackNavigationProp<any>;
};

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>

        {/* Last Updated */}
        <View style={styles.updateCard}>
          <MaterialIcons name="update" size={20} color="#5B21B6" />
          <Text style={styles.updateText}>Last updated: October 18, 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to MoveMates. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our app and tell you about your privacy rights.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Personal Information</Text>
            <Text style={styles.paragraph}>
              We collect information that you provide directly to us, including:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Name and contact information</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Profile photo and bio</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Phone number and email address</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Location data during walks</Text>
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Usage Information</Text>
            <Text style={styles.paragraph}>
              We automatically collect certain information about your device and how you interact with our app, including app usage patterns, device information, and log data.
            </Text>
          </View>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Provide and maintain our services</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Connect walkers and wanderers</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Ensure safety through location tracking</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Send notifications and updates</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Improve our services and user experience</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Prevent fraud and ensure security</Text>
            </View>
          </View>
        </View>

        {/* Information Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal information. We may share your information only in the following circumstances:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>With matched walkers/wanderers for walk coordination</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>With your consent</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>To comply with legal obligations</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>To protect rights, property, or safety</Text>
            </View>
          </View>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Access your personal data</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Correct inaccurate data</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Request deletion of your data</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Object to data processing</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Withdraw consent at any time</Text>
            </View>
          </View>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your personal data only for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </Text>
        </View>

        {/* Changes to Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this privacy policy, please contact us through the app or email us at privacy@movemates.com.
          </Text>
        </View>

        {/* Contact Support Button */}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => navigation.navigate('ContactSupport')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="support-agent" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
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
  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 25,
  },
  updateText: {
    fontSize: 13,
    color: '#5B21B6',
    marginLeft: 10,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  subsection: {
    marginTop: 15,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 10,
  },
  bulletList: {
    marginTop: 10,
    marginLeft: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  contactButton: {
    backgroundColor: '#5B21B6',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PrivacyPolicyScreen;
