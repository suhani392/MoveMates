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

type HelpPolicyScreenProps = {
  navigation: StackNavigationProp<any>;
};

const HelpPolicyScreen: React.FC<HelpPolicyScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Policy</Text>
        </View>

        {/* FAQs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          <TouchableOpacity 
            style={[styles.card, styles.faqCard]}
            onPress={() => navigation.navigate('FAQs')}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Have Doubts?</Text>
              <Text style={styles.cardSubtitle}>Find answers to common questions</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity 
            style={[styles.card, styles.supportCard]}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Contact Support</Text>
              <Text style={styles.cardSubtitle}>Reach out for personal assistance</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity 
            style={[styles.card, styles.legalCard]}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Privacy Policy</Text>
              <Text style={styles.cardSubtitle}>How we handle your data</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.legalCard, styles.lastCard]}
            onPress={() => navigation.navigate('TermsConditions')}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Terms & Conditions</Text>
              <Text style={styles.cardSubtitle}>Rules for using MoveMates</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#000000" />
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 15,
    marginBottom: 12,
  },
  faqCard: {
    backgroundColor: '#E8F6E9',
  },
  supportCard: {
    backgroundColor: '#F7EDD9',
  },
  legalCard: {
    backgroundColor: '#D9DFF7',
  },
  lastCard: {
    marginBottom: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default HelpPolicyScreen;
