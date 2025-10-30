import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
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

const WalkerTestScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(TEST_DURATION_SECONDS);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef();

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

  if (!started) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Walker Assessment Quiz</Text>
        <Text style={styles.desc}>This quiz measures empathy, safety, honesty, ethical behavior and more—answer honestly. The test is 35 minutes. Please begin only when ready—once started, timer cannot be paused and answers are final.</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => setStarted(true)}>
          <Text style={styles.btnText}>Start Test</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper: get unique sections in order
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentWrap}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Walker Test</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{Math.floor(remaining/60).toString().padStart(2,'0')}:{(remaining%60).toString().padStart(2,'0')}</Text>
        </View>
      </View>
      {SECTIONS.map(section => {
        const questions = QUESTIONS.filter(q => q.section === section);
        if (!questions.length) return null;
        const sectionStyle = {
          backgroundColor: '#FFFFFF', // Default white
        };
        if (section === 'Empathy & Compassion') sectionStyle.backgroundColor = '#D9DFF7';
        if (section === 'Honesty & Accountability') sectionStyle.backgroundColor = '#F6E8E8';
        if (section === 'Safety & Responsibility') sectionStyle.backgroundColor = '#E8F6E9';
        if (section === 'Emotional Stability') sectionStyle.backgroundColor = '#E8F6F4';
        if (section === 'Respect & Boundaries') sectionStyle.backgroundColor = '#F6E8E8';
        if (section === 'Commitment & Motivation') sectionStyle.backgroundColor = '#E8F6E9';
        if (section === 'Ethical Dilemmas & Judgment') sectionStyle.backgroundColor = '#D9DFF7';
        if (section === 'Real-Life Situations & Stress Handling') sectionStyle.backgroundColor = '#F6E8E8';
        if (section === 'Open-Ended Reflection') sectionStyle.backgroundColor = '#F8EDD9';

        return (
          <View key={section} style={[styles.sectionCard, sectionStyle]}>
            <Text style={styles.sectionHeader}>{section}</Text>
            {questions.map((q, idx) => (
              <View key={q.key} style={styles.qblock}>
                <Text style={styles.qtext}>{(
                  QUESTIONS.findIndex(q0 => q0.key === q.key) + 1
                )}. {q.text}</Text>
                {q.open ? (
                  <TextInput
                    value={answers[q.key] || ''}
                    onChangeText={t => handleAnswer(q.key, t)}
                    style={styles.openInput}
                    multiline minHeight={70}
                    placeholder="Type your answer here..."
                    placeholderTextColor="#666"
                  />
                ) : (
                  q.options.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optBtn, answers[q.key] === opt && styles.optBtnSelected]}
                      onPress={() => handleAnswer(q.key, opt)}
                      disabled={isSubmitting || submitted}
                    >
                      <Text style={answers[q.key] === opt ? styles.optTxtSelected : styles.optTxt}>{opt}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ))}
          </View>
        );
      })}
      <TouchableOpacity
        style={[styles.submitBtn, (isSubmitting || submitted)]}
        onPress={() => handleSubmit()}
        disabled={isSubmitting || submitted}
      >
        <Text style={styles.btnText}>{isSubmitting ? 'Submitting...' : 'Submit Test'}</Text>
      </TouchableOpacity>
      {submitted && <Text style={styles.submitNote}>Test submitted! You may now close the app. Await admin review.</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentWrap: { padding: 20, paddingBottom: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#0092DF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  timerText: {
    color: '#0092DF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, marginTop: 50, color: '#000', textAlign:'center' },
  desc: { fontSize: 16, color: '#444', textAlign:'center', marginVertical: 20 },
  startBtn: { backgroundColor: '#000', borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 50 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
  time: { fontSize: 18, textAlign:'center', marginVertical: 14, fontWeight:'700', color:'#C92D2D' },
  sectionCard: {
    marginBottom: 34, backgroundColor: '#F0F8FF', borderRadius: 22, padding: 16, borderWidth:1, borderColor: '#D9D9D9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 8, elevation:2
  },
  sectionHeader: { fontSize: 20, color: '#000', fontWeight: 'bold', marginBottom: 18, textAlign:'left', letterSpacing: 0.2 },
  qblock: { marginBottom: 23, borderRadius:18, backgroundColor:'#FFFFFF', padding:12, borderWidth:1, borderColor:'#D9D9D9' },
  qtext: { fontSize: 16, color:'#222', marginBottom: 10, fontWeight:'500' },
  optBtn: { paddingVertical: 12, paddingHorizontal: 15, backgroundColor:'#D9D9D9', borderRadius:19, marginBottom: 9, marginTop:3 },
  optBtnSelected: { backgroundColor:'#4CAF50' },
  optTxt: { fontSize: 15, color: '#333' },
  optTxtSelected: { color:'#FFF', fontWeight:'bold', fontSize:16 },
  openInput: { backgroundColor: '#F0F8FF', borderRadius:14, padding:13, fontSize:15, marginBottom: 3, borderWidth:1, borderColor:'#D9D9D9', color:'#111' },
  submitBtn: { backgroundColor:'#000', borderRadius:30, alignItems:'center', paddingVertical: 17, marginTop:13, marginBottom: 36, opacity: 1 },
  submitNote: { color: '#008900', textAlign:'center', marginVertical: 22, fontWeight:'bold', fontSize: 16 },
});

export default WalkerTestScreen;
