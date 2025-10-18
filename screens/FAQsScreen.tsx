import React, { useState } from 'react';
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

type FAQsScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'walker' | 'wanderer' | 'safety' | 'payment';
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: 'general',
    question: 'What is MoveMates?',
    answer: 'MoveMates is a platform that connects wanderers (people who need walking assistance) with walkers (people who can provide walking assistance). It helps create a safe and supportive community for those who need companionship during walks.',
  },
  {
    id: '2',
    category: 'general',
    question: 'How do I get started?',
    answer: 'Simply sign up, choose your role (Walker or Wanderer), complete your profile, and start connecting! Walkers need admin approval before they can accept requests.',
  },
  {
    id: '3',
    category: 'wanderer',
    question: 'How do I request a walk?',
    answer: 'Go to your home screen, enter your pickup location and destination, select a date and time, then choose from available walkers. Once a walker accepts, you\'ll receive a notification.',
  },
  {
    id: '4',
    category: 'wanderer',
    question: 'Can I cancel a walk request?',
    answer: 'Yes, you can cancel a walk request before it\'s accepted. Once accepted, please contact the walker directly through the chat feature to discuss cancellation.',
  },
  {
    id: '5',
    category: 'walker',
    question: 'How do I become a walker?',
    answer: 'Sign up and select "Walker" as your role. Complete your profile with accurate information. Your account will be reviewed by our admin team for approval, which typically takes 24-48 hours.',
  },
  {
    id: '6',
    category: 'walker',
    question: 'How do I accept walk requests?',
    answer: 'Once approved, you\'ll see incoming walk requests on your home screen. Review the details and tap "Accept" if you\'re available. You can also decline requests that don\'t fit your schedule.',
  },
  {
    id: '7',
    category: 'safety',
    question: 'Is MoveMates safe?',
    answer: 'Yes! We verify all walkers through an admin approval process. We also provide real-time location sharing during walks and in-app chat for communication. Always meet in public places and trust your instincts.',
  },
  {
    id: '8',
    category: 'safety',
    question: 'What safety features are available?',
    answer: 'MoveMates includes live location tracking, verified walker profiles, in-app messaging, emergency contact sharing, and walk history tracking. You can also report any issues to our support team.',
  },
  {
    id: '9',
    category: 'payment',
    question: 'Is MoveMates free to use?',
    answer: 'Yes, MoveMates is currently free for both walkers and wanderers. We believe in making walking assistance accessible to everyone in our community.',
  },
  {
    id: '10',
    category: 'general',
    question: 'Can I switch between Walker and Wanderer roles?',
    answer: 'Yes! You can change your role in Settings > General > Role Change. Note that switching to Walker will require admin approval again.',
  },
  {
    id: '11',
    category: 'general',
    question: 'How do I contact support?',
    answer: 'You can reach our support team through Help & Policy > Contact Support, or email us directly. We typically respond within 24 hours.',
  },
  {
    id: '12',
    category: 'safety',
    question: 'What should I do if I feel unsafe?',
    answer: 'Your safety is our priority. If you feel unsafe at any time, end the walk immediately and move to a safe, public location. You can report the incident through the app or contact local authorities if needed.',
  },
];

const FAQsScreen: React.FC<FAQsScreenProps> = ({ navigation }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'general', label: 'General', icon: 'info' },
    { id: 'walker', label: 'Walker', icon: 'accessibility-new' },
    { id: 'wanderer', label: 'Wanderer', icon: 'directions-walk' },
    { id: 'safety', label: 'Safety', icon: 'security' },
    { id: 'payment', label: 'Payment', icon: 'payment' },
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQs</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Find answers to frequently asked questions
        </Text>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.activeCategoryChip,
              ]}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={category.icon as any} 
                size={18} 
                color={selectedCategory === category.id ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.activeCategoryText,
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ List */}
        <View style={styles.faqList}>
          {filteredFAQs.map((faq) => (
            <View key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleExpand(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.questionContainer}>
                  <MaterialIcons 
                    name="help-outline" 
                    size={22} 
                    color="#5B21B6" 
                    style={styles.questionIcon}
                  />
                  <Text style={styles.question}>{faq.question}</Text>
                </View>
                <MaterialIcons
                  name={expandedId === faq.id ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666666"
                />
              </TouchableOpacity>
              
              {expandedId === faq.id && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answer}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Still Have Questions */}
        <View style={styles.helpCard}>
          <MaterialIcons name="support-agent" size={40} color="#5B21B6" />
          <View style={styles.helpTextContainer}>
            <Text style={styles.helpTitle}>Still have questions?</Text>
            <Text style={styles.helpSubtitle}>
              Our support team is here to help
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupport')}
            activeOpacity={0.8}
          >
            <Text style={styles.contactButtonText}>Contact Us</Text>
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
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  categoryScroll: {
    marginBottom: 25,
  },
  categoryContainer: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    gap: 6,
  },
  activeCategoryChip: {
    backgroundColor: '#000000',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  faqList: {
    marginBottom: 25,
  },
  faqCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  questionIcon: {
    marginRight: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 0,
    paddingLeft: 52,
  },
  answer: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  helpCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  helpTextContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  helpSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#5B21B6',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FAQsScreen;
