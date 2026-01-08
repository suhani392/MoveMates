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

type TermsConditionsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const TermsConditionsScreen: React.FC<TermsConditionsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
        </View>

        {/* Last Updated */}
        <View style={styles.updateCard}>
          <MaterialIcons name="update" size={20} color="#059669" />
          <Text style={styles.updateText}>Last updated: October 18, 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using MoveMates, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
          </Text>
        </View>

        {/* Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.paragraph}>
            You must be at least 18 years old to use MoveMates. By using our services, you represent and warrant that you meet this age requirement and have the legal capacity to enter into this agreement.
          </Text>
        </View>

        {/* User Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Account Creation</Text>
            <Text style={styles.paragraph}>
              You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Account Security</Text>
            <Text style={styles.paragraph}>
              You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.
            </Text>
          </View>
        </View>

        {/* User Roles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Roles</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Walkers</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Must undergo admin verification before accepting requests</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Must provide accurate availability information</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Must honor accepted walk commitments</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Must maintain professional and respectful conduct</Text>
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Wanderers</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Must provide accurate pickup and destination information</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Must be present at scheduled meeting times</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
                <Text style={styles.bulletText}>Must treat walkers with respect and courtesy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Prohibited Conduct */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Prohibited Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Violate any laws or regulations</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Harass, threaten, or harm other users</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Provide false or misleading information</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Use the service for commercial purposes without authorization</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Attempt to gain unauthorized access to our systems</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Interfere with the proper functioning of the service</Text>
            </View>
          </View>
        </View>

        {/* Safety Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Safety Guidelines</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Always meet in public, well-lit areas</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Share your walk details with trusted contacts</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Trust your instincts and report suspicious behavior</Text>
            </View>
            <View style={styles.bulletItem}>
              <MaterialIcons name="fiber-manual-record" size={8} color="#666666" />
              <Text style={styles.bulletText}>Use the in-app communication features</Text>
            </View>
          </View>
        </View>

        {/* Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            MoveMates acts as a platform to connect users. We are not responsible for the actions, conduct, or safety of users. Users interact at their own risk. We do not guarantee the accuracy of user-provided information.
          </Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, MoveMates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion. You may also delete your account at any time through the app settings.
          </Text>
        </View>

        {/* Intellectual Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of MoveMates are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute our content without permission.
          </Text>
        </View>

        {/* Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify users of significant changes. Your continued use of the service after changes constitutes acceptance of the new terms.
          </Text>
        </View>

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which MoveMates operates, without regard to conflict of law provisions.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these terms, please contact us through the app or email us at legal@movemates.com.
          </Text>
        </View>

        {/* Acceptance */}
        <View style={styles.acceptanceCard}>
          <MaterialIcons name="check-circle" size={24} color="#22C55E" />
          <Text style={styles.acceptanceText}>
            By using MoveMates, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
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
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 25,
  },
  updateText: {
    fontSize: 13,
    color: '#059669',
    marginLeft: 10,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
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
  acceptanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  acceptanceText: {
    fontSize: 13,
    color: '#059669',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  contactButton: {
    backgroundColor: '#059669',
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

export default TermsConditionsScreen;
