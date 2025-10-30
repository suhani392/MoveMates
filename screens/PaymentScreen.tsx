import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Linking,
  Modal,
  ActivityIndicator,
  Clipboard,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { fetchPricingConfig, calculateFare, PricingConfig, FareBreakdown } from '../services/pricingService';
import {
  createPaymentRecord,
  updatePaymentUPI,
  updatePaymentCash,
  generateUPIDeeplink,
  generateTxnRef,
  PaymentMethod,
} from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { onSnapshot, doc, collection, query, where, updateDoc } from 'firebase/firestore';

type PaymentScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ 
    params: { 
      requestId: string;
      distance: number;
      duration: number;
      walkerId: string;
      walkerName: string;
      isWandererView?: boolean;
    } 
  }, 'params'>;
};

const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { requestId, distance, duration, walkerId, walkerName, isWandererView = true } = route.params;
  const { user, userData } = useAuth();
  
  // Static QR code - Local image (FREE!)
  const STATIC_QR_IMAGE = require('../assets/images/movemates-qr.jpg');
  
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  
  // UPI specific
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [upiDeeplink, setUpiDeeplink] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [txnId, setTxnId] = useState('');
  
  // Cash specific
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [paymentObserved, setPaymentObserved] = useState(false);
  
  // Payment received confirmation modal
  const [showPaymentReceivedModal, setShowPaymentReceivedModal] = useState(false);

  useEffect(() => {
    loadPricingAndCalculate();
  }, [tip]);

  // Listen for payment confirmation by walker (for wanderers)
  // Instead of listening to payments collection, listen to the walk request
  useEffect(() => {
    if (!isWandererView || !user || !requestId) return;
    
    console.log('Setting up walk request listener for payment status:', requestId);
    
    // Listen to the walk request document which wanderer has permission to read
    const requestRef = doc(db, 'walkRequests', requestId);
    
    const unsub = onSnapshot(
      requestRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        
        const data = snapshot.data();
        console.log('Walk request data:', data);
        
        // Check if payment is confirmed (we'll add this field when walker confirms)
        if (data.paymentConfirmed === true) {
          console.log('Payment confirmed via walk request, redirecting to success');
          navigation.replace('PaymentSuccess', {
            amount: fareBreakdown?.total || 0,
            method: data.paymentMethod || 'upi',
            walkerName: walkerName,
            isWandererView: true,
            walkerId: walkerId,
            wandererId: user.uid,
            requestId: requestId,
          });
        }
      },
      (error) => {
        console.error('Walk request listener error:', error);
      }
    );
    
    return () => unsub();
  }, [isWandererView, requestId, navigation, walkerName, user, fareBreakdown]);

  const loadPricingAndCalculate = async () => {
    try {
      const config = await fetchPricingConfig();
      setPricingConfig(config);
      
      const breakdown = calculateFare(distance, duration, tip, config);
      setFareBreakdown(breakdown);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading pricing:', error);
      Alert.alert('Error', 'Failed to load pricing information');
      setLoading(false);
    }
  };

  const handleTipSelect = (amount: number) => {
    setTip(amount);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    const numValue = parseFloat(value) || 0;
    setTip(numValue);
  };

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    if (!pricingConfig || !fareBreakdown || !user || !userData) return;
    
    setProcessing(true);
    
    try {
      // Create payment record
      const newPaymentId = await createPaymentRecord(
        requestId,
        user.uid,
        walkerId,
        distance,
        duration,
        fareBreakdown,
        pricingConfig,
        method
      );
      
      setPaymentId(newPaymentId);
      setSelectedMethod(method);
      
      if (method === 'upi') {
        // Generate UPI details
        const ref = generateTxnRef(requestId);
        setTxnRef(ref);
        
        const deeplink = generateUPIDeeplink(
          pricingConfig.platformVpa,
          pricingConfig.platformName,
          fareBreakdown.total,
          ref,
          `Walk Payment #${requestId.substring(0, 8)}`
        );
        setUpiDeeplink(deeplink);
        
        // Update payment with UPI details
        await updatePaymentUPI(
          newPaymentId,
          ref,
          pricingConfig.platformVpa,
          pricingConfig.platformName
        );
        
        setShowUPIModal(true);
      } else if (method === 'cash') {
        // Show cash confirmation
        Alert.alert(
          'Cash Payment',
          `Please pay ₹${fareBreakdown.total} in cash to ${walkerName}.\n\nBoth you and the walker need to confirm receipt.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setSelectedMethod(null),
            },
            {
              text: isWandererView ? 'I Paid Cash' : 'I Received Cash',
              onPress: () => handleCashConfirm(newPaymentId),
            },
          ]
        );
      }
      
      setProcessing(false);
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  const handlePaymentReceivedConfirm = () => {
    setShowPaymentReceivedModal(false);
    navigation.replace('PaymentSuccess', {
      amount: fareBreakdown!.total,
      method: 'upi',
      walkerName,
      isWandererView,
      walkerId,
      wandererId: user!.uid,
      requestId,
    });
  };

  const handleCashConfirm = async (newPaymentId: string) => {
    try {
      setProcessing(true);
      
      // For now, we'll mark as confirmed from wanderer side
      // In production, both sides should confirm
      await updatePaymentCash(
        newPaymentId,
        walkerId,
        !isWandererView, // walker confirms
        isWandererView   // wanderer confirms
      );
      
      setCashConfirmed(true);
      setProcessing(false);
      
      // Navigate to success screen
      navigation.replace('PaymentSuccess', {
        amount: fareBreakdown!.total,
        method: 'cash',
        walkerName,
        isWandererView,
      });
    } catch (error) {
      console.error('Error confirming cash payment:', error);
      Alert.alert('Error', 'Failed to confirm payment');
      setProcessing(false);
    }
  };

  const handleOpenUPIApp = async () => {
    try {
      const supported = await Linking.canOpenURL(upiDeeplink);
      if (supported) {
        await Linking.openURL(upiDeeplink);
        
        // Show helpful message after opening UPI app
        setTimeout(() => {
          Alert.alert(
            'Payment Tips',
            'If you see "Limit Exceeded" error:\n\n' +
            '• Your bank has daily/monthly UPI limits\n' +
            '• Contact your bank to increase limits\n' +
            '• Try a different bank account\n' +
            '• Use Cash payment option instead\n\n' +
            'Tap "Help" (?) for more info',
            [{ text: 'Got it' }]
          );
        }, 1000);
      } else {
        Alert.alert('Error', 'No UPI app found. Please scan the QR code instead.');
      }
    } catch (error) {
      console.error('Error opening UPI app:', error);
      Alert.alert('Error', 'Failed to open UPI app');
    }
  };

  const handleUPIConfirm = async () => {
    if (!txnId.trim()) {
      Alert.alert('Required', 'Please enter the transaction ID');
      return;
    }
    
    if (!paymentId) return;
    
    try {
      setProcessing(true);
      
      await updatePaymentUPI(
        paymentId,
        txnRef,
        pricingConfig!.platformVpa,
        pricingConfig!.platformName,
        txnId,
        'self_declared'
      );
      
      setShowUPIModal(false);
      setProcessing(false);
      
      // Navigate to success screen
      navigation.replace('PaymentSuccess', {
        amount: fareBreakdown!.total,
        method: 'upi',
        walkerName,
        isWandererView,
      });
    } catch (error) {
      console.error('Error confirming UPI payment:', error);
      Alert.alert('Error', 'Failed to confirm payment');
      setProcessing(false);
    }
  };

  const handleDone = () => {
    navigation.navigate('WalkerHome');
  };

  if (loading || !fareBreakdown || !pricingConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const distanceInKm = fareBreakdown.distanceKm.toFixed(1);
  const durationInMin = fareBreakdown.durationMinutes;

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#FFF', paddingTop: 32}}>
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
          <TouchableOpacity 
            onPress={() => navigation.navigate('PaymentHelp')} 
            style={styles.backButton}
          >
            <MaterialIcons name="help-outline" size={28} color="#000000" />
          </TouchableOpacity>
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
            <Text style={styles.summaryValue}>{durationInMin} min</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Fare</Text>
            <Text style={styles.summaryValue}>₹{fareBreakdown.baseFare}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time Charge ({fareBreakdown.perMinute}/min × {durationInMin})</Text>
            <Text style={styles.summaryValue}>₹{fareBreakdown.timeCharge}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distance Charge ({fareBreakdown.perKm}/km × {distanceInKm})</Text>
            <Text style={styles.summaryValue}>₹{fareBreakdown.distanceCharge}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{fareBreakdown.subtotal}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Commission (25%)</Text>
            <Text style={styles.summaryValue}>₹{fareBreakdown.commission}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Walker Earnings</Text>
            <Text style={[styles.summaryValue, styles.highlightGreen]}>₹{fareBreakdown.walkerEarnings}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total to Pay</Text>
            <Text style={styles.totalValue}>₹{fareBreakdown.total}</Text>
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
            <Text style={styles.finalTotalValue}>₹{fareBreakdown.total}</Text>
          </View>
        )}

        {/* Wanderer View - Payment Method Selection */}
        {isWandererView && !selectedMethod && (
          <View style={styles.methodContainer}>
            <Text style={styles.methodTitle}>Choose Payment Method</Text>
            
            {/* UPI Payment Card */}
            <TouchableOpacity
              style={styles.methodCard}
              onPress={() => setSelectedMethod('upi')}
              disabled={processing}
              activeOpacity={0.7}
            >
              <View style={styles.methodIconContainer}>
                <View style={styles.methodIconCircle}>
                  <MaterialIcons name="account-balance" size={32} color="#6366F1" />
                </View>
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodCardTitle}>UPI Payment</Text>
                <Text style={styles.methodCardSubtitle}>PhonePe • GPay • Paytm</Text>
              </View>
              <MaterialIcons name="chevron-right" size={28} color="#CCCCCC" />
            </TouchableOpacity>

            {/* Cash Payment Card */}
            <TouchableOpacity
              style={styles.methodCard}
              onPress={() => setSelectedMethod('cash')}
              disabled={processing}
              activeOpacity={0.7}
            >
              <View style={styles.methodIconContainer}>
                <View style={[styles.methodIconCircle, styles.methodIconCircleCash]}>
                  <MaterialIcons name="payments" size={32} color="#10B981" />
                </View>
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodCardTitle}>Cash Payment</Text>
                <Text style={styles.methodCardSubtitle}>Pay directly to walker</Text>
              </View>
              <MaterialIcons name="chevron-right" size={28} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        )}

        {/* Wanderer View - UPI Payment Instructions (after selecting UPI) */}
        {isWandererView && selectedMethod === 'upi' && (
          <View style={styles.paymentInstructionsCard}>
            <MaterialIcons name="qr-code-scanner" size={48} color="#6366F1" />
            <Text style={styles.instructionsTitle}>How to Pay</Text>
            <Text style={styles.instructionsText}>
              1. Ask the walker to show their QR code{'\n'}
              2. Open your UPI app (PhonePe/GPay){'\n'}
              3. Scan the QR code from walker's screen{'\n'}
              4. Pay ₹{fareBreakdown.total}{'\n'}
              5. Walker will confirm payment received
            </Text>
            <View style={styles.amountHighlight}>
              <Text style={styles.amountHighlightLabel}>Amount to Pay:</Text>
              <Text style={styles.amountHighlightValue}>₹{fareBreakdown.total}</Text>
            </View>
          </View>
        )}

        {/* Wanderer View - Cash Payment Instructions (after selecting Cash) */}
        {isWandererView && selectedMethod === 'cash' && (
          <View style={styles.paymentInstructionsCard}>
            <MaterialIcons name="money" size={48} color="#10B981" />
            <Text style={styles.instructionsTitle}>Pay Cash to Walker</Text>
            <Text style={styles.instructionsText}>
              Please pay ₹{fareBreakdown.total} in cash to the walker.{'\n\n'}
              After payment, the walker will confirm receipt.
            </Text>
            <View style={styles.amountHighlight}>
              <Text style={styles.amountHighlightLabel}>Amount to Pay:</Text>
              <Text style={styles.amountHighlightValue}>₹{fareBreakdown.total}</Text>
            </View>
          </View>
        )}

        {/* Walker View - Show QR Code and Done Button */}
        {!isWandererView && (
          <View style={styles.walkerPaymentContainer}>
            {/* Show QR Code for UPI Payment */}
            <View style={styles.staticQRContainer}>
              <Text style={styles.walkerTitle}>Show This QR Code to Wanderer</Text>
              <Text style={styles.walkerSubtitle}>
                For UPI payment - Wanderer will scan to pay ₹{fareBreakdown.total}
              </Text>
              
              <Image
                source={STATIC_QR_IMAGE}
                style={styles.staticQRImage}
                resizeMode="contain"
              />
              <View style={styles.qrInfoContainer}>
                <Text style={styles.qrUpiId}>UPI: {pricingConfig?.platformVpa}</Text>
                <Text style={styles.qrPhoneNumber}>Phone: 8793855507</Text>
              </View>
            </View>

            <View style={styles.walkerInstructions}>
              <MaterialIcons name="info" size={20} color="#6366F1" />
              <Text style={styles.walkerInstructionsText}>
                After wanderer completes payment (UPI or Cash), click "Payment Received" below
              </Text>
            </View>

            <TouchableOpacity
              style={styles.paymentReceivedButton}
              onPress={async () => {
                try {
                  setProcessing(true);
                  // Create payment record as paid
                  const newPaymentId = await createPaymentRecord(
                    requestId,
                    user!.uid,
                    walkerId,
                    distance,
                    duration,
                    fareBreakdown,
                    pricingConfig!,
                    'upi'
                  );
                  
                  // Mark as paid (walker confirmed)
                  await updatePaymentUPI(
                    newPaymentId,
                    `MANUAL-${Date.now()}`,
                    pricingConfig!.platformVpa,
                    pricingConfig!.platformName,
                    'WALKER_CONFIRMED',
                    'walker_confirmed'
                  );
                  
                  // Update walk request to notify wanderer
                  const requestRef = doc(db, 'walkRequests', requestId);
                  await updateDoc(requestRef, {
                    paymentConfirmed: true,
                    paymentMethod: 'upi',
                    paymentConfirmedAt: new Date(),
                  });
                  
                  setProcessing(false);
                  setShowPaymentReceivedModal(true);
                } catch (error) {
                  console.error('Error confirming payment:', error);
                  Alert.alert('Error', 'Failed to confirm payment');
                  setProcessing(false);
                }
              }}
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.paymentReceivedButtonText}>Payment Received</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* UPI Payment Modal */}
      <Modal
        visible={showUPIModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUPIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pay via UPI</Text>
              <TouchableOpacity onPress={() => setShowUPIModal(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
            <View style={styles.upiAmountContainer}>
              <Text style={styles.upiAmountLabel}>Amount to Pay</Text>
              <Text style={styles.upiAmountValue}>₹{fareBreakdown?.total}</Text>
            </View>

            {/* Bank Limit Warning */}
            <View style={styles.bankLimitWarning}>
              <MaterialIcons name="info" size={20} color="#EF4444" />
              <View style={styles.bankLimitContent}>
                <Text style={styles.bankLimitTitle}>Getting "Limit Exceeded"?</Text>
                <Text style={styles.bankLimitText}>
                  This is a bank limit, not an app issue. Check your daily UPI limit or use Cash payment.
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('PaymentHelp')}>
                  <Text style={styles.bankLimitLink}>Tap here for solutions →</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.upiDetailsContainer}>
              <Text style={styles.upiDetailLabel}>Pay to: {pricingConfig?.platformName}</Text>
              <View style={styles.upiIdRow}>
                <Text style={styles.upiDetailValue}>{pricingConfig?.platformVpa}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    Clipboard.setString(pricingConfig?.platformVpa || '');
                    Alert.alert('Copied!', 'UPI ID copied to clipboard');
                  }}
                >
                  <MaterialIcons name="content-copy" size={18} color="#6366F1" />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.upiRefLabel}>Ref: {txnRef}</Text>
            </View>

            {/* Payment Method Buttons */}
            <TouchableOpacity
              style={styles.upiAppButton}
              onPress={handleOpenUPIApp}
            >
              <MaterialIcons name="open-in-new" size={20} color="#FFFFFF" />
              <Text style={styles.upiAppButtonText}>Pay via UPI App</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualUpiButton}
              onPress={() => {
                Clipboard.setString(pricingConfig?.platformVpa || '');
                Alert.alert(
                  'UPI ID Copied!',
                  `Pay ₹${fareBreakdown?.total} to:\n${pricingConfig?.platformVpa}\n\nSteps:\n1. Open any UPI app\n2. Click "Send Money"\n3. Paste UPI ID\n4. Enter amount: ₹${fareBreakdown?.total}\n5. Complete payment\n6. Enter Transaction ID below`,
                  [{ text: 'Got it' }]
                );
              }}
            >
              <MaterialIcons name="account-balance" size={20} color="#10B981" />
              <Text style={styles.manualUpiButtonText}>Copy UPI ID & Pay Manually</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR SCAN QR CODE</Text>
              <View style={styles.orLine} />
            </View>

            {/* QR Code - Alternative Method */}
            <View style={styles.qrContainer}>
              <Text style={styles.qrLabel}>Scan QR Code</Text>
              <View style={styles.qrWarning}>
                <MaterialIcons name="info" size={16} color="#F59E0B" />
                <Text style={styles.qrWarningText}>
                  Scan directly with camera. Don't take screenshot!
                </Text>
              </View>
              {upiDeeplink && (
                <QRCode
                  value={upiDeeplink}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              )}
              <Text style={styles.qrHint}>
                Open PhonePe/GPay and scan this QR code with camera
              </Text>
            </View>

            {/* Transaction ID Input */}
            <View style={styles.txnIdContainer}>
              <Text style={styles.txnIdLabel}>After payment, enter Transaction ID (UTR):</Text>
              <TextInput
                style={styles.txnIdInput}
                placeholder="Enter 12-digit UTR/Txn ID"
                value={txnId}
                onChangeText={setTxnId}
                keyboardType="numeric"
                maxLength={20}
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
              onPress={handleUPIConfirm}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Payment</Text>
              )}
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Received Confirmation Modal */}
      <Modal
        visible={showPaymentReceivedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentReceivedModal(false)}
      >
        <View style={styles.paymentReceivedModalOverlay}>
          <View style={styles.paymentReceivedModalContent}>
            <View style={styles.paymentReceivedIconContainer}>
              <MaterialIcons name="check-circle" size={64} color="#10B981" />
            </View>
            
            <Text style={styles.paymentReceivedModalTitle}>Payment Confirmed!</Text>
            <Text style={styles.paymentReceivedModalMessage}>
              Payment has been successfully marked as received. The walk is now complete.
            </Text>

            <TouchableOpacity
              style={styles.paymentReceivedConfirmButton}
              onPress={handlePaymentReceivedConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.paymentReceivedConfirmButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
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
  highlightGreen: {
    color: '#10B981',
    fontWeight: '700',
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
  methodContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  methodTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  methodIconContainer: {
    marginRight: 16,
  },
  methodIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconCircleCash: {
    backgroundColor: '#D1FAE5',
  },
  methodContent: {
    flex: 1,
  },
  methodCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  methodCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  methodButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 64,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodButtonCash: {
    backgroundColor: '#F59E0B',
    minHeight: 64,
  },
  methodButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 15,
    flex: 1,
    marginTop: -8,
  },
  methodButtonSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    position: 'absolute',
    left: 59,
    bottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    maxHeight: '90%',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  upiAmountContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  upiAmountLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  upiAmountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  bankLimitWarning: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  bankLimitContent: {
    flex: 1,
  },
  bankLimitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  bankLimitText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 8,
  },
  bankLimitLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },
  upiDetailsContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  upiDetailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  upiIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  upiDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  upiRefLabel: {
    fontSize: 12,
    color: '#666666',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  qrWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  qrWarningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  qrHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginHorizontal: 16,
  },
  upiAppButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  upiAppButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  manualUpiButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  manualUpiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  txnIdContainer: {
    marginBottom: 20,
  },
  txnIdLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  txnIdInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Wanderer Instructions Styles
  paymentInstructionsCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  amountHighlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  amountHighlightLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  amountHighlightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  // Walker QR Display Styles
  walkerPaymentContainer: {
    marginTop: 20,
  },
  walkerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  walkerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  staticQRContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  staticQRImage: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  qrInfoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  qrUpiId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  qrPhoneNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  walkerInstructions: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  walkerInstructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  paymentReceivedButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentReceivedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentReceivedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentReceivedModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  paymentReceivedIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentReceivedModalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  paymentReceivedModalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  paymentReceivedConfirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentReceivedConfirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PaymentScreen;
