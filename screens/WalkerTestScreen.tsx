import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Dimensions, Animated, Easing, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { db, serverTimestamp } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const QUESTIONS = [
  // Section 1: Empathy & Compassion
  { section: 'Empathy & Compassion', text: 'If your wanderer walks slowly or takes frequent breaks, how do you usually feel?', options: ['a) It’s fine, I adjust my pace for their comfort.', 'b) I try to encourage them gently to keep moving.', 'c) I get a little impatient but stay quiet.', 'd) I find it frustrating and prefer faster walks.'], key: 'q1' },
  { section: 'Empathy & Compassion', text: 'You notice your wanderer seems upset or quiet during the walk. What would you do?', options: ['a) Ask if everything’s okay and offer to listen.', 'b) Stay silent and just focus on walking.', 'c) Try to make light conversation to distract them.', 'd) End the walk early.'], key: 'q2' },
  // Section 2: Honesty & Accountability
  { section: 'Honesty & Accountability', text: 'Suppose you accidentally end the walk earlier than the actual time. What do you do?', options: ['a) Inform the wanderer and offer to correct it.', 'b) Leave it — it’s a small mistake.', 'c) Contact support later if they notice.', 'd) Say nothing unless they ask.'], key: 'q3' },
  { section: 'Honesty & Accountability', text: 'You see another walker behaving rudely with their wanderer. What’s your first reaction?', options: ['a) Report them through the app.', 'b) Talk to them privately later.', 'c) Ignore it — not my concern.', 'd) Support them — the wanderer might have provoked it.'], key: 'q4' },
  // Section 3: Safety & Responsibility
  { section: 'Safety & Responsibility', text: 'A wanderer insists on taking a risky route at night. How would you handle it?', options: ['a) Firmly refuse and explain why it’s unsafe.', 'b) Follow their request but stay alert.', 'c) Let them go first and follow behind.', 'd) Agree — it’s their choice.'], key: 'q5' },
  { section: 'Safety & Responsibility', text: 'You’re late to reach the pickup point because of traffic. What will you do?', options: ['a) Call or message to inform them immediately.', 'b) Rush and explain later.', 'c) Stay quiet unless they ask.', 'd) Blame external factors like the app or location.'], key: 'q6' },
  // Section 4: Emotional Stability
  { section: 'Emotional Stability', text: 'A wanderer gives you a low rating even though you were polite. What’s your reaction?', options: ['a) Accept feedback calmly and move on.', 'b) Feel bad but don’t act on it.', 'c) Message them to ask why.', 'd) Feel angry and report them.'], key: 'q7' },
  { section: 'Emotional Stability', text: 'During the walk, the wanderer suddenly changes their plan multiple times. How do you respond?', options: ['a) Stay patient and adjust.', 'b) Politely express your concern but still cooperate.', 'c) Complain but continue the walk.', 'd) End the walk early.'], key: 'q8' },
  // Section 5: Respect & Boundaries
  { section: 'Respect & Boundaries', text: 'The wanderer tries to become overly friendly or personal. What would you do?', options: ['a) Politely maintain professional distance.', 'b) Chat casually to keep things friendly.', 'c) Ignore it completely.', 'd) Match their tone and continue talking personally.'], key: 'q9' },
  { section: 'Respect & Boundaries', text: 'The wanderer asks you to take a photo together for fun. What will you do?', options: ['a) Politely decline unless it’s for app feedback.', 'b) Agree if they seem genuine and it feels safe.', 'c) Refuse immediately — no photos at all.', 'd) Take the photo but don’t upload it anywhere.'], key: 'q10' },
  // Section 6: Commitment & Motivation
  { section: 'Commitment & Motivation', text: 'Why do you want to be a walker on this platform?', options: ['a) I like helping people and being a safe companion.', 'b) I enjoy walking and staying fit.', 'c) It’s a good way to earn extra money.', 'd) I want to explore new places and meet people.'], key: 'q11' },
  { section: 'Commitment & Motivation', text: 'How do you define a safe and respectful walk?', options: ['a) When both walker and wanderer feel comfortable and respected.', 'b) When the route is short and easy.', 'c) When the payment and time are managed well.', 'd) When the conversation is fun.'], key: 'q12' },
  // Section 7: Ethical Dilemmas & Judgment
  { section: 'Ethical Dilemmas & Judgment', text: 'You notice your wanderer accidentally drops their wallet, but they don’t realize it. What do you do?', options: ['a) Return it immediately and inform them.', 'b) Wait until they ask, then give it back.', 'c) Leave it where it fell.', 'd) Keep it — they might have dropped it intentionally.'], key: 'q13' },
  { section: 'Ethical Dilemmas & Judgment', text: 'During a walk, your wanderer starts badmouthing the app or another walker. What’s your approach?', options: ['a) Stay neutral and avoid joining the negativity.', 'b) Agree politely to avoid conflict.', 'c) Defend the app strongly.', 'd) Change the topic smoothly without reacting.'], key: 'q14' },
  { section: 'Ethical Dilemmas & Judgment', text: 'A friend asks you to fake a few walks to earn extra bonuses. What would you do?', options: ['a) Refuse and report it if needed.', 'b) Decline silently but don’t report.', 'c) Help once but not regularly.', 'd) Agree — it’s harmless.'], key: 'q15' },
  { section: 'Ethical Dilemmas & Judgment', text: 'You’re walking a wanderer who starts recording you without permission. How do you respond?', options: ['a) Ask them politely to stop or explain why.', 'b) Ignore it and continue walking.', 'c) Get angry and confront them.', 'd) End the walk immediately without saying anything.'], key: 'q16' },
  // Section 8: Real-Life Situations & Stress Handling
  { section: 'Real-Life Situations & Stress Handling', text: 'It’s raining heavily, but your wanderer still wants to continue walking. What do you do?', options: ['a) Advise against it and wait for rain to ease.', 'b) Follow their wish but ensure you both stay safe.', 'c) Leave — you didn’t sign up for this.', 'd) Argue until they cancel the walk.'], key: 'q17' },
  { section: 'Real-Life Situations & Stress Handling', text: 'Your phone battery is at 5%, and the walk hasn’t ended. What will you do?', options: ['a) Inform the wanderer and try to find a solution.', 'b) Continue quietly and hope it lasts.', 'c) End the walk early before it dies.', 'd) Don’t tell — just let it die.'], key: 'q18' },
  { section: 'Real-Life Situations & Stress Handling', text: 'You and your wanderer get into a disagreement about directions. What’s your approach?', options: ['a) Discuss calmly and decide together.', 'b) Follow what they say, even if wrong.', 'c) Prove them wrong using the map.', 'd) Get annoyed but stay silent.'], key: 'q19' },
  { section: 'Real-Life Situations & Stress Handling', text: 'You find out your wanderer has a physical disability you weren’t told about earlier. What do you do?', options: ['a) Adjust pace and assist respectfully without pity.', 'b) Feel awkward but continue.', 'c) Complain to support for lack of notice.', 'd) Cancel the walk.'], key: 'q20' },
  // Section 9: Open-Ended Reflection Questions
  { section: 'Open-Ended Reflection', text: 'Describe a time when someone trusted you and how you maintained that trust.', open: true, key: 'q21' },
  { section: 'Open-Ended Reflection', text: 'If a wanderer gets emotional during the walk, what’s the best way to respond?', open: true, key: 'q22' },
  { section: 'Open-Ended Reflection', text: 'How would you ensure a walk remains safe, enjoyable, and professional for both sides?', open: true, key: 'q23' },
];

const TRAIT_SCORES = {
  Empathy: { questions: [0,1], weight: 2.0, ideal: ['a','b'], redflag: ['c','d'] },
  Honesty: { questions: [2,3], weight: 2.0, ideal: ['a'], redflag: ['b','d'] },
  Safety: { questions: [4,5], weight: 1.5, ideal: ['a'], redflag: ['c','d'] },
  Calmness: { questions: [6,7], weight: 1.0, ideal: ['a','b'], redflag: ['c','d'] },
  Boundaries: { questions: [8,9], weight: 1.0, ideal: ['a','b'], redflag: ['c','d'] },
  Motivation: { questions: [10,11], weight: 0.5, ideal: ['a','b'], redflag: ['c'] },
  Ethics: { questions: [12,13,14,15], weight: 2.0, ideal: ['a','d'], redflag: ['b','c'] },
  // Open-ended: not scored
};
const MAX_SCORE = 9.5;

function evaluateTrustIndex(answers) {
  let traitSum = 0;
  let traits = {};
  Object.entries(TRAIT_SCORES).forEach(([trait, def]) => {
    let score = 0;
    def.questions.forEach(qIdx => {
      const ans = answers[QUESTIONS[qIdx].key];
      if (!ans) return;
      const ansLabel = ans.split(')')[0]; // 'a', 'b', ...
      if (def.ideal.includes(ansLabel)) score += 1;
      else if (def.redflag.includes(ansLabel)) score -= 1;
    });
    // Normalize by num questions so all traits max normalize to 1
    const traitNorm = def.questions.length ? score / def.questions.length : 0;
    // Weighted
    traits[trait] = traitNorm * def.weight;
    traitSum += traits[trait];
  });
  const index = Math.max(0, Math.min(1, traitSum / MAX_SCORE)) * 100;
  return { trustIndex: Math.round(index), traits };
}

const TEST_DURATION_SECONDS = 35 * 60;

const { width } = Dimensions.get('window');

const WalkerTestScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(TEST_DURATION_SECONDS);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  
  const SECTIONS = [
    'Empathy & Compassion',
    'Honesty & Accountability',
    'Safety & Responsibility',
    'Emotional Stability',
    'Respect & Boundaries',
    'Commitment & Motivation',
    'Ethical Dilemmas & Judgment',
    'Real-Life Situations & Stress Handling',
    'Open-Ended Reflection'
  ];
  
  const sectionQuestions = SECTIONS.map(section => 
    QUESTIONS.filter(q => q.section === section)
  );
  
  const totalQuestions = QUESTIONS.length;
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;
  
  // Check if all questions are answered
  useEffect(() => {
    const allAnswered = QUESTIONS.every(q => q.open || answers[q.key]);
    setAllQuestionsAnswered(allAnswered);
  }, [answers]);

  useEffect(() => {
    if (started && !submitted) {
      timerRef.current = setInterval(() => {
        setRemaining(sec => {
          if (sec <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(true);
            return 0;
          } else return sec - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started, submitted]);

  const handleAnswer = (key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (autoEnd=false) => {
    if (submitted) return;
    if (!autoEnd) {
      const incomplete = QUESTIONS.filter((q, i) => !q.open && !answers[q.key]);
      if (incomplete.length > 0) {
        Alert.alert('Incomplete', 'Please answer all questions before submitting.');
        return;
      }
    }
    setIsSubmitting(true);
    // Evaluate
    const scoreObj = evaluateTrustIndex(answers);
    try {
      await setDoc(doc(db, 'userTests', user.uid), {
        userId: user.uid,
        answers,
        score: scoreObj.trustIndex,
        traitScores: scoreObj.traits,
        submittedAt: serverTimestamp(),
        duration: TEST_DURATION_SECONDS - remaining,
      });
      setSubmitted(true);
      Alert.alert(
        'Test Submitted',
        'Your responses have been submitted. Await approval.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('PendingApproval')
          }
        ],
        { cancelable: false }
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit test. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentSection]);

  const scrollToSection = (index) => {
    setCurrentSection(index);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: width * index,
        animated: true
      });
    }
  };

  if (!started) {
    return (
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.screen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.introContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="psychology" size={80} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Walker Assessment</Text>
            <Text style={styles.subtitle}>Let's get to know you better</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="timer" size={22} color="#4F46E5" />
                </View>
                <Text style={styles.infoText}>35 minutes</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="help-outline" size={22} color="#4F46E5" />
                </View>
                <Text style={styles.infoText}>{QUESTIONS.length} questions</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="info-outline" size={22} color="#4F46E5" />
                </View>
                <Text style={styles.infoText}>No time limit per question</Text>
              </View>
            </View>
            
            <Text style={styles.description}>
              This assessment helps us understand your approach to various situations you might encounter as a walker. 
              Please answer honestly as your responses will help us match you with compatible walking partners.
            </Text>
            
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setStarted(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.startButtonText}>Begin Assessment</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // SECTIONS is already defined at the top of the component

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.testContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back-ios" size={22} color="#4F46E5" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.progressContainer}>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  <Text style={styles.progressTextBold}>{answeredQuestions}</Text> / {totalQuestions} questions
                </Text>
                <Text style={styles.timerText}>
                  <MaterialIcons name="timer" size={16} color="#6B7280" />
                  {' '}{Math.floor(remaining/60).toString().padStart(2,'0')}:{(remaining%60).toString().padStart(2,'0')}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: progress + '%',
                      backgroundColor: progress < 50 ? '#4F46E5' : progress < 80 ? '#7C3AED' : '#10B981'
                    }
                  ]}
                />
              </View>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {SECTIONS.map((section, sectionIndex) => {
          const questions = sectionQuestions[sectionIndex];
          if (!questions.length) return null;
          
          const sectionColors = {
          'Empathy & Compassion': { 
            bg: '#EEF2FF', 
            border: '#4F46E5',
            icon: 'favorite',
            color: '#4F46E5'
          },
          'Honesty & Accountability': { 
            bg: '#F5F3FF', 
            border: '#7C3AED',
            icon: 'gavel',
            color: '#7C3AED'
          },
          'Safety & Responsibility': { 
            bg: '#F0FDF4', 
            border: '#10B981',
            icon: 'shield',
            color: '#10B981'
          },
          'Emotional Stability': { 
            bg: '#EFF6FF', 
            border: '#3B82F6',
            icon: 'psychology',
            color: '#3B82F6'
          },
          'Respect & Boundaries': { 
            bg: '#FDF2F8', 
            border: '#EC4899',
            icon: 'handshake',
            color: '#EC4899'
          },
          'Commitment & Motivation': { 
            bg: '#FEF3C7', 
            border: '#F59E0B',
            icon: 'emoji-events',
            color: '#D97706'
          },
          'Ethical Dilemmas & Judgment': { 
            bg: '#F3E8FF', 
            border: '#8B5CF6',
            icon: 'balance',
            color: '#8B5CF6'
          },
          'Real-Life Situations & Stress Handling': { 
            bg: '#FEF3F2', 
            border: '#EF4444',
            icon: 'flash-on',
            color: '#EF4444'
          },
          'Open-Ended Reflection': { 
            bg: '#ECFDF5', 
            border: '#10B981',
            icon: 'edit-note',
            color: '#10B981'
          },
        };
        
        const sectionColor = sectionColors[section] || { bg: '#FFFFFF', border: '#E2E8F0' };
        
        return (
          <Animated.View 
            key={section} 
            style={[
              styles.sectionCard, 
              { 
                backgroundColor: '#FFFFFF',
                borderTopWidth: 4,
                borderTopColor: sectionColor.border,
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
                shadowColor: sectionColor.border,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }
            ]}
          >
            <View style={styles.sectionHeaderContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: `${sectionColor.color}15` }]}>
                <MaterialIcons name={sectionColor.icon} size={24} color={sectionColor.color} />
              </View>
              <View>
                <Text style={[styles.sectionHeader, { color: sectionColor.color }]}>{section}</Text>
                <Text style={styles.sectionSubheader}>
                  Section {sectionIndex + 1} of {SECTIONS.length} • {questions.length} question{questions.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {questions.map((q, qIndex) => (
                <View key={q.key} style={styles.qblock}>
                  <View style={styles.questionHeader}>
                    <View style={[styles.questionNumber, { backgroundColor: `${sectionColor.color}20` }]}>
                      <Text style={[styles.qnumber, { color: sectionColor.color }]}>{qIndex + 1}</Text>
                    </View>
                    <Text style={styles.qtext}>{q.text}</Text>
                  </View>
                  {q.options ? (
                    q.options.map((opt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.option,
                          answers[q.key] === opt && [styles.optionSelected, { borderColor: sectionColor.color }]
                        ]}
                        onPress={() => handleAnswer(q.key, opt)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.optionRadio, 
                          answers[q.key] === opt && [styles.optionRadioSelected, { borderColor: sectionColor.color }]
                        ]}>
                          {answers[q.key] === opt && (
                            <View style={[styles.optionRadioInner, { backgroundColor: sectionColor.color }]} />
                          )}
                        </View>
                        <Text style={[
                          styles.optionText,
                          answers[q.key] === opt && [styles.optionTextSelected, { color: sectionColor.color }]
                        ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="Type your answer here..."
                        placeholderTextColor="#A0AEC0"
                        value={answers[q.key] || ''}
                        onChangeText={(text) => handleAnswer(q.key, text)}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.navigationContainer}>
              <View style={styles.navButtonsWrapper}>
                <TouchableOpacity 
                  style={[
                    styles.navButton, 
                    styles.navButtonPrev,
                    sectionIndex === 0 && { opacity: 0.5, backgroundColor: '#F3F4F6' }
                  ]} 
                  onPress={() => scrollToSection(sectionIndex - 1)}
                  disabled={sectionIndex === 0}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="arrow-back-ios" size={16} color={sectionIndex === 0 ? '#9CA3AF' : '#4F46E5'} />
                  <Text style={[styles.navButtonText, sectionIndex === 0 && { color: '#9CA3AF' }]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                
                {sectionIndex < SECTIONS.length - 1 ? (
                  <TouchableOpacity 
                    style={[styles.navButton, styles.navButtonNext]}
                    onPress={() => scrollToSection(sectionIndex + 1)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.navButtonNextText}>Next Section</Text>
                    <MaterialIcons name="arrow-forward-ios" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.submitButton, 
                      isSubmitting && { opacity: 0.7 },
                      !allQuestionsAnswered && { backgroundColor: '#9CA3AF' }
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !allQuestionsAnswered}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </Text>
                    <MaterialIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                )}
              </View>
              
              {sectionIndex < SECTIONS.length - 1 && (
                <TouchableOpacity 
                  style={styles.skipSection}
                  onPress={() => scrollToSection(sectionIndex + 1)}
                >
                  <Text style={styles.skipText}>Skip this section</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        );
        })}
        {submitted && <Text style={styles.submitNote}>Test submitted! You may now close the app. Await admin review.</Text>}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  screen: {
    flex: 1,
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Inter-Medium',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#4B5563',
    fontFamily: 'Inter-Medium',
  },
  description: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  startButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    fontFamily: 'Inter-SemiBold',
  },
  testContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  progressTextBold: {
    fontWeight: '700',
    color: '#111827',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Inter-Medium',
  },
  sectionScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  sectionCard: {
    width: width - 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  sectionSubheader: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  qnumber: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  qtext: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
  },
  qblock: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  optionSelected: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1.5,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    marginRight: 14,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionRadioSelected: {
    borderWidth: 1.5,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    fontFamily: 'Inter-Regular',
  },
  optionTextSelected: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  textInputContainer: {
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  navigationContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  navButtonsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 140,
  },
  navButtonPrev: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navButtonNext: {
    backgroundColor: '#4F46E5',
    flex: 1,
    marginLeft: 12,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 6,
    color: '#4F46E5',
    fontFamily: 'Inter-SemiBold',
  },
  navButtonNextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 6,
    fontFamily: 'Inter-SemiBold',
  },
  skipSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
    fontFamily: 'Inter-Medium',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  submitNote: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
});

export default WalkerTestScreen;
