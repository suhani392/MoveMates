import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type PaymentHelpScreenProps = {
  navigation: StackNavigationProp<any>;
};

const PaymentHelpScreen: React.FC<PaymentHelpScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Help</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Common Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="error-outline" size={24} color="#EF4444" />
            <Text style={styles.sectionTitle}>Common Payment Issues</Text>
          </View>

          <View style={styles.issueCard}>
            <Text style={styles.issueTitle}>❌ "Limit Exceeded" Error</Text>
            <Text style={styles.issueDescription}>
              This means you've reached your daily/monthly UPI transaction limit set by your bank. This is NOT an app problem - it's your bank's security limit.
            </Text>
            <Text style={styles.solutionTitle}>Immediate Solutions:</Text>
            <Text style={styles.solutionItem}>✅ Use Cash Payment (available in app)</Text>
            <Text style={styles.solutionItem}>✅ Try a different bank account/UPI ID</Text>
            <Text style={styles.solutionItem}>✅ Ask someone else to pay and reimburse them</Text>
            <Text style={[styles.solutionTitle, {marginTop: 12}]}>Long-term Solutions:</Text>
            <Text style={styles.solutionItem}>• Call your bank: Ask to increase UPI limits</Text>
            <Text style={styles.solutionItem}>• Complete Full KYC at your bank</Text>
            <Text style={styles.solutionItem}>• Wait 24 hours for daily limit reset</Text>
            <Text style={styles.solutionItem}>• Check your bank app for current limits</Text>
          </View>

          <View style={styles.issueCard}>
            <Text style={styles.issueTitle}>❌ "Can pay up to ₹2000 with QR from gallery"</Text>
            <Text style={styles.issueDescription}>
              PhonePe/GPay restrict payments from saved QR codes (screenshots) for security.
            </Text>
            <Text style={styles.solutionTitle}>Solutions:</Text>
            <Text style={styles.solutionItem}>• Click "Pay via UPI App" button instead</Text>
            <Text style={styles.solutionItem}>• Scan QR code directly with camera (don't screenshot)</Text>
            <Text style={styles.solutionItem}>• Use the deeplink to open UPI app directly</Text>
          </View>

          <View style={styles.issueCard}>
            <Text style={styles.issueTitle}>❌ Transaction Failed</Text>
            <Text style={styles.issueDescription}>
              Payment may fail due to network issues, insufficient balance, or bank restrictions.
            </Text>
            <Text style={styles.solutionTitle}>Solutions:</Text>
            <Text style={styles.solutionItem}>• Check your bank balance</Text>
            <Text style={styles.solutionItem}>• Ensure stable internet connection</Text>
            <Text style={styles.solutionItem}>• Try again after a few minutes</Text>
            <Text style={styles.solutionItem}>• Contact your bank if issue persists</Text>
          </View>
        </View>

        {/* UPI Limits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="account-balance" size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Understanding UPI Limits</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Daily Transaction Limits</Text>
            <Text style={styles.infoText}>
              Most banks set daily UPI limits between ₹1,000 to ₹1,00,000 depending on:
            </Text>
            <Text style={styles.infoItem}>• Account type (Savings/Current)</Text>
            <Text style={styles.infoItem}>• KYC verification level (Minimum/Full)</Text>
            <Text style={styles.infoItem}>• Bank's risk assessment</Text>
            <Text style={styles.infoItem}>• Account age and history</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to Check Your UPI Limits</Text>
            <Text style={styles.infoText}>Open your bank's app and look for:</Text>
            <Text style={styles.infoItem}>• "UPI Settings" or "Transaction Limits"</Text>
            <Text style={styles.infoItem}>• "Daily Transaction Limit"</Text>
            <Text style={styles.infoItem}>• "Per Transaction Limit"</Text>
            <Text style={styles.infoItem}>• "Monthly Transaction Limit"</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to Increase Limits</Text>
            <Text style={styles.infoItem}>1. Complete Full KYC with your bank</Text>
            <Text style={styles.infoItem}>2. Call your bank's customer care</Text>
            <Text style={styles.infoItem}>3. Visit bank branch with ID proof</Text>
            <Text style={styles.infoItem}>4. Use internet banking to modify limits</Text>
            <Text style={styles.infoItem}>5. Some banks allow limit changes in their app</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>QR Code vs Direct Payment</Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Direct Payment (Recommended):</Text> Higher limits, instant processing
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>QR from Gallery:</Text> Limited to ₹2,000 for security
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Camera Scan:</Text> Full limits apply
            </Text>
          </View>
        </View>

        {/* Best Practices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="check-circle" size={24} color="#10B981" />
            <Text style={styles.sectionTitle}>Best Practices</Text>
          </View>

          <View style={styles.tipCard}>
            <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Use "Pay via UPI App" Button</Text>
              <Text style={styles.tipText}>
                This opens your UPI app directly with payment details pre-filled. It's faster and has no QR code restrictions.
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Keep Transaction ID (UTR)</Text>
              <Text style={styles.tipText}>
                Always save the 12-digit UTR/Transaction ID after payment. You'll need it to confirm the payment in the app.
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Cash Payment Option</Text>
              <Text style={styles.tipText}>
                If UPI isn't working, you can always pay cash directly to the walker. Both parties need to confirm receipt.
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.supportCard}>
          <MaterialIcons name="support-agent" size={32} color="#6366F1" />
          <Text style={styles.supportTitle}>Still Having Issues?</Text>
          <Text style={styles.supportText}>
            Contact your bank's customer care or visit the nearest branch for assistance with UPI limits and payment issues.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  issueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  issueDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  solutionItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#000000',
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PaymentHelpScreen;
