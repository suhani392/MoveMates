import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type PaymentScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ 
    params: { 
      requestId: string;
      distance: number;
      duration: number;
      walkerRate: number;
      walkerName: string;
      isWandererView?: boolean;
    } 
  }, 'params'>;
};

const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { requestId, distance, duration, walkerRate, walkerName, isWandererView = true } = route.params;
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');

  // Calculate costs
  const distanceInKm = (distance / 1000).toFixed(1); // Convert meters to km
  const durationInHours = (duration / 60).toFixed(1); // Convert minutes to hours
  const finalCost = walkerRate * (duration / 60); // Rate per hour
  const otherCharges = 0;
  const totalCost = finalCost + otherCharges + tip;

  const handleTipSelect = (amount: number) => {
    setTip(amount);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    const numValue = parseFloat(value) || 0;
    setTip(numValue);
  };

  const handleProceedToPay = () => {
    Alert.alert(
      'Payment',
      `Total Amount: Rs. ${totalCost.toFixed(2)}\n\nProceed with payment?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pay Now',
          onPress: () => {
            // TODO: Implement payment gateway integration
            Alert.alert(
              'Payment Successful',
              'Thank you for using MoveMates!',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('RequestWalk'),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDone = () => {
    navigation.navigate('WalkerHome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Payment</Text>
          <View style={styles.backButton} />
        </View>

        {/* Thank You Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>The walk has ended.</Text>
          {isWandererView ? (
            <Text style={styles.messageSubtitle}>
              Hope you enjoyed the walk with our walker..!
            </Text>
          ) : (
            <Text style={styles.messageSubtitle}>
              Here is a summary of the trip and payout details.
            </Text>
          )}
        </View>

        {/* Walk Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Distance Walked</Text>
            <Text style={styles.summaryValue}>{distanceInKm} km</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Time Taken</Text>
            <Text style={styles.summaryValue}>{durationInHours} hour</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate of Walker</Text>
            <Text style={styles.summaryValue}>{walkerRate}/hour</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Final Cost</Text>
            <Text style={styles.summaryValue}>Rs. {finalCost.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Other Charges</Text>
            <Text style={styles.summaryValue}>---</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total cost</Text>
            <Text style={styles.totalValue}>Rs. {(finalCost + otherCharges).toFixed(2)}</Text>
          </View>
        </View>

        {/* Tip Section (wanderer only) */}
        {isWandererView && (
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View>
              <Text style={styles.tipTitle}>Liked the experience with walker?</Text>
              <Text style={styles.tipSubtitle}>You may add a tip for the walker.</Text>
            </View>
          </View>

          {/* Quick Tip Options */}
          <View style={styles.tipOptions}>
            <TouchableOpacity
              style={[styles.tipButton, tip === 10 && styles.tipButtonActive]}
              onPress={() => handleTipSelect(10)}
            >
              <Text style={[styles.tipButtonText, tip === 10 && styles.tipButtonTextActive]}>
                +10
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipButton, tip === 20 && styles.tipButtonActive]}
              onPress={() => handleTipSelect(20)}
            >
              <Text style={[styles.tipButtonText, tip === 20 && styles.tipButtonTextActive]}>
                +20
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipButton, tip === 50 && styles.tipButtonActive]}
              onPress={() => handleTipSelect(50)}
            >
              <Text style={[styles.tipButtonText, tip === 50 && styles.tipButtonTextActive]}>
                +50
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Tip Input */}
          <View style={styles.customTipContainer}>
            <Text style={styles.customTipLabel}>Add a Tip</Text>
            <TextInput
              style={styles.customTipInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={customTip}
              onChangeText={handleCustomTipChange}
            />
          </View>

          {tip > 0 && (
            <Text style={styles.tipAmount}>Tip: Rs. {tip}</Text>
          )}
        </View>
        )}

        {/* Final Total with Tip (wanderer only) */}
        {isWandererView && tip > 0 && (
          <View style={styles.finalTotalCard}>
            <Text style={styles.finalTotalLabel}>Total Amount (including tip)</Text>
            <Text style={styles.finalTotalValue}>Rs. {totalCost.toFixed(2)}</Text>
          </View>
        )}

        {/* Primary Action Button */}
        {isWandererView ? (
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleProceedToPay}
            activeOpacity={0.8}
          >
            <Text style={styles.payButtonText}>Proceed to Pay</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.payButtonText}>Done</Text>
          </TouchableOpacity>
        )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  messageContainer: {
    marginBottom: 30,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  messageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333333',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  tipCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  tipSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333333',
  },
  tipBadge: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tipBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  tipButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  tipButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  tipButtonTextActive: {
    color: '#FFFFFF',
  },
  customTipContainer: {
    marginTop: 10,
  },
  customTipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  customTipInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  tipAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 10,
    textAlign: 'right',
  },
  finalTotalCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  payButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PaymentScreen;
