import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

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

        // Fetch test results
        const q = query(collection(db, 'testResults'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setTestResults({
            id: doc.id,
            ...doc.data()
          } as TestResult);
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
              {Object.entries(testResults.answers).map(([question, answer], index) => (
                <View key={question} style={styles.answerRow}>
                  <Text style={styles.questionText}>{index + 1}. {question}</Text>
                  <Text style={styles.answerText}>{answer}</Text>
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
    padding: 16,
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
