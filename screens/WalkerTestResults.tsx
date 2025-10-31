import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

// Map question keys to their full text used in the test
const QUESTION_TEXTS: Record<string, string> = {
  q1: 'If your wanderer walks slowly or takes frequent breaks, how do you usually feel?',
  q2: 'You notice your wanderer seems upset or quiet during the walk. What would you do?',
  q3: 'Suppose you accidentally end the walk earlier than the actual time. What do you do?',
  q4: 'You see another walker behaving rudely with their wanderer. What’s your first reaction?',
  q5: 'A wanderer insists on taking a risky route at night. How would you handle it?',
  q6: 'You’re late to reach the pickup point because of traffic. What will you do?',
  q7: 'A wanderer gives you a low rating even though you were polite. What’s your reaction?',
  q8: 'During the walk, the wanderer suddenly changes their plan multiple times. How do you respond?',
  q9: 'The wanderer tries to become overly friendly or personal. What would you do?',
  q10: 'The wanderer asks you to take a photo together for fun. What will you do?',
  q11: 'Why do you want to be a walker on this platform?',
  q12: 'How do you define a safe and respectful walk?',
  q13: 'You notice your wanderer accidentally drops their wallet, but they don’t realize it. What do you do?',
  q14: 'During a walk, your wanderer starts badmouthing the app or another walker. What’s your approach?',
  q15: 'A friend asks you to fake a few walks to earn extra bonuses. What would you do?',
  q16: 'You’re walking a wanderer who starts recording you without permission. How do you respond?',
  q17: 'It’s raining heavily, but your wanderer still wants to continue walking. What do you do?',
  q18: 'Your phone battery is at 5%, and the walk hasn’t ended. What will you do?',
  q19: 'You and your wanderer get into a disagreement about directions. What’s your approach?',
  q20: 'You find out your wanderer has a physical disability you weren’t told about earlier. What do you do?',
  q21: 'Describe a time when someone trusted you and how you maintained that trust.',
  q22: 'If a wanderer gets emotional during the walk, what’s the best way to respond?',
  q23: 'How would you ensure a walk remains safe, enjoyable, and professional for both sides?',
};

type RootStackParamList = {
  WalkerTestResults: { userId: string };
};

type WalkerTestResultsScreenProps = {
  route: RouteProp<RootStackParamList, 'WalkerTestResults'>;
  navigation: StackNavigationProp<any>;
};

interface TestResult {
  id: string;
  userId: string;
  score: number;
  submittedAt: any;
  answers?: Record<string, string>;
  traitScores?: Record<string, number>;
}

const WalkerTestResults: React.FC<WalkerTestResultsScreenProps> = ({ route, navigation }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() });
        }

        // Fetch test results from userTests/{userId}
        const testDoc = await getDoc(doc(db, 'userTests', userId));
        if (testDoc.exists()) {
          const data = testDoc.data() as any;
          setTestResults({
            id: testDoc.id,
            userId: data.userId,
            score: data.score,
            submittedAt: data.submittedAt,
            answers: data.answers,
            traitScores: data.traitScores,
          });
        }
      } catch (error) {
        console.error('Error fetching test results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  if (!testResults) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Results</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.noResultsContainer}>
          <MaterialIcons name="quiz" size={64} color="#CCCCCC" />
          <Text style={styles.noResultsText}>No test results found for this walker</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Results</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.userName}>{userData?.name || 'Walker'}'s Test Results</Text>
          <Text style={styles.email}>{userData?.email || ''}</Text>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Overall Score:</Text>
            <Text style={[
              styles.scoreValue,
              { color: testResults.score >= 70 ? '#4CAF50' : '#F44336' }
            ]}>
              {testResults.score}/100
            </Text>
          </View>

          {testResults.traitScores && Object.keys(testResults.traitScores).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trait Scores:</Text>
              {Object.entries(testResults.traitScores).map(([trait, score]) => (
                <View key={trait} style={styles.traitRow}>
                  <Text style={styles.traitName}>{trait}:</Text>
                  <Text style={styles.traitScore}>{score.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          )}

          {testResults.answers && Object.keys(testResults.answers).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Answers:</Text>
              {Object.entries(testResults.answers)
                .sort((a, b) => {
                  const qa = parseInt(String(a[0]).replace(/[^0-9]/g, '')) || 0;
                  const qb = parseInt(String(b[0]).replace(/[^0-9]/g, '')) || 0;
                  return qa - qb;
                })
                .map(([key, answer], index) => (
                  <View key={String(key)} style={styles.answerRow}>
                    <Text style={styles.questionText}>{index + 1}. {QUESTION_TEXTS[String(key)] || String(key)}</Text>
                    <Text style={styles.answerText}>{String(answer)}</Text>
                  </View>
                ))}
            </View>
          )}

          <Text style={styles.dateText}>
            Submitted on: {testResults.submittedAt?.toDate()?.toLocaleString() || 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  traitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  traitName: {
    fontSize: 14,
    color: '#555555',
  },
  traitScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  answerRow: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default WalkerTestResults;
