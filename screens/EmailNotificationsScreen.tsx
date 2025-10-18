import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type EmailNotificationsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const EmailNotificationsScreen: React.FC<EmailNotificationsScreenProps> = ({ navigation }) => {
  const [allEmails, setAllEmails] = useState(true);
  const [walkSummary, setWalkSummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [accountActivity, setAccountActivity] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [tips, setTips] = useState(true);
  const [surveys, setSurveys] = useState(false);

  const handleToggleAll = (value: boolean) => {
    setAllEmails(value);
    if (!value) {
      setWalkSummary(false);
      setWeeklyReport(false);
      setAccountActivity(false);
      setSecurityAlerts(false);
      setNewsletter(false);
      setTips(false);
      setSurveys(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Notifications</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Choose which email notifications you want to receive
        </Text>

        {/* Master Toggle */}
        <View style={[styles.emailCard, styles.masterCard]}>
          <View style={styles.emailInfo}>
            <MaterialIcons name="email" size={24} color="#000000" />
            <View style={styles.emailText}>
              <Text style={styles.emailName}>All Email Notifications</Text>
              <Text style={styles.emailDescription}>
                Enable or disable all email notifications
              </Text>
            </View>
          </View>
          <Switch
            value={allEmails}
            onValueChange={handleToggleAll}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={allEmails ? '#22C55E' : '#F3F4F6'}
          />
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          
          <View style={styles.emailCard}>
            <View style={styles.emailInfo}>
              <MaterialIcons name="summarize" size={24} color="#5B21B6" />
              <View style={styles.emailText}>
                <Text style={styles.emailName}>Walk Summary</Text>
                <Text style={styles.emailDescription}>
                  Daily summary of your walks
                </Text>
              </View>
            </View>
            <Switch
              value={walkSummary}
              onValueChange={setWalkSummary}
              disabled={!allEmails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={walkSummary ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.emailCard}>
            <View style={styles.emailInfo}>
              <MaterialIcons name="assessment" size={24} color="#059669" />
              <View style={styles.emailText}>
                <Text style={styles.emailName}>Weekly Report</Text>
                <Text style={styles.emailDescription}>
                  Weekly activity and statistics
                </Text>
              </View>
            </View>
            <Switch
              value={weeklyReport}
              onValueChange={setWeeklyReport}
              disabled={!allEmails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={weeklyReport ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.emailCard}>
            <View style={styles.emailInfo}>
              <MaterialIcons name="account-circle" size={24} color="#3B82F6" />
              <View style={styles.emailText}>
                <Text style={styles.emailName}>Account Activity</Text>
                <Text style={styles.emailDescription}>
                  Profile changes and updates
                </Text>
              </View>
            </View>
            <Switch
              value={accountActivity}
              onValueChange={setAccountActivity}
              disabled={!allEmails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={accountActivity ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.emailCard}>
            <View style={styles.emailInfo}>
              <MaterialIcons name="security" size={24} color="#EF4444" />
              <View style={styles.emailText}>
                <Text style={styles.emailName}>Security Alerts</Text>
                <Text style={styles.emailDescription}>
                  Important security notifications
                </Text>
              </View>
            </View>
            <Switch
              value={securityAlerts}
              onValueChange={setSecurityAlerts}
              disabled={!allEmails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={securityAlerts ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Marketing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing</Text>
          
          <View style={styles.emailCard}>
            <View style={styles.emailInfo}>
              <MaterialIcons name="article" size={24} color="#F59E0B" />
              <View style={styles.emailText}>
                <Text style={styles.emailName}>Newsletter</Text>
                <Text style={styles.emailDescription}>
                  Monthly newsletter and updates
                </Text>
              </View>
            </View>
            <Switch
              value={newsletter}
              onValueChange={setNewsletter}
              disabled={!allEmails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={newsletter ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.emailCard}>
            <View style={styles.emailInfo}>
              <MaterialIcons name="lightbulb" size={24} color="#EC4899" />
              <View style={styles.emailText}>
                <Text style={styles.emailName}>Tips & Tricks</Text>
                <Text style={styles.emailDescription}>
                  Helpful tips to improve your experience
                </Text>
              </View>
            </View>
            <Switch
              value={tips}
              onValueChange={setTips}
              disabled={!allEmails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={tips ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.emailCard}>
            <View style={styles.emailInfo}>
              <MaterialIcons name="poll" size={24} color="#6366F1" />
              <View style={styles.emailText}>
                <Text style={styles.emailName}>Surveys & Feedback</Text>
                <Text style={styles.emailDescription}>
                  Help us improve with your feedback
                </Text>
              </View>
            </View>
            <Switch
              value={surveys}
              onValueChange={setSurveys}
              disabled={!allEmails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={surveys ? '#22C55E' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
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
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 25,
    lineHeight: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  masterCard: {
    backgroundColor: '#F7EDD9',
    marginBottom: 30,
  },
  emailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  emailText: {
    marginLeft: 15,
    flex: 1,
  },
  emailName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  emailDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EmailNotificationsScreen;
