import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { PricingConfig, FareBreakdown } from './pricingService';

export type PaymentMethod = 'cash' | 'upi';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'disputed';
export type VerificationType = 'self_declared' | 'proof_uploaded' | 'app_return' | 'walker_confirmed';

export interface PaymentRecord {
  id: string;
  requestId: string;
  wandererId: string;
  walkerId: string;
  
  // Trip details
  distanceMeters: number;
  durationMinutes: number;
  
  // Pricing snapshot
  baseFare: number;
  perMinute: number;
  perKm: number;
  commissionRate: number;
  
  // Calculated amounts
  fare: number;
  commission: number;
  walkerEarnings: number;
  tip: number;
  totalPayable: number;
  
  // Payment details
  method: PaymentMethod;
  status: PaymentStatus;
  
  // UPI specific
  upi?: {
    payeeVpa: string;
    payeeName: string;
    txnRef: string;
    txnId?: string;
    responseRaw?: string;
    verification: VerificationType;
  };
  
  // Cash specific
  cash?: {
    collectedBy: string;
    collectorConfirm: boolean;
    wandererConfirm: boolean;
  };
  
  createdAt: any;
  updatedAt: any;
}

/**
 * Create a new payment record
 */
export const createPaymentRecord = async (
  requestId: string,
  wandererId: string,
  walkerId: string,
  distanceMeters: number,
  durationMinutes: number,
  fareBreakdown: FareBreakdown,
  config: PricingConfig,
  method: PaymentMethod
): Promise<string> => {
  try {
    const paymentRef = doc(collection(db, 'payments'));
    const paymentId = paymentRef.id;
    
    const paymentData: Partial<PaymentRecord> = {
      id: paymentId,
      requestId,
      wandererId,
      walkerId,
      distanceMeters,
      durationMinutes,
      baseFare: config.baseFare,
      perMinute: config.perMinute,
      perKm: config.perKm,
      commissionRate: config.commissionRate,
      fare: fareBreakdown.subtotal,
      commission: fareBreakdown.commission,
      walkerEarnings: fareBreakdown.walkerEarnings,
      tip: fareBreakdown.tip,
      totalPayable: fareBreakdown.total,
      method,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(paymentRef, paymentData);
    return paymentId;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
};

/**
 * Update payment with UPI details
 */
export const updatePaymentUPI = async (
  paymentId: string,
  txnRef: string,
  payeeVpa: string,
  payeeName: string,
  txnId?: string,
  verification: VerificationType = 'self_declared'
): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      'upi.payeeVpa': payeeVpa,
      'upi.payeeName': payeeName,
      'upi.txnRef': txnRef,
      'upi.txnId': txnId || null,
      'upi.verification': verification,
      status: txnId ? 'paid' : 'pending',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating UPI payment:', error);
    throw error;
  }
};

/**
 * Update payment with Cash confirmation
 */
export const updatePaymentCash = async (
  paymentId: string,
  walkerId: string,
  collectorConfirm: boolean,
  wandererConfirm: boolean
): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    const status = (collectorConfirm && wandererConfirm) ? 'paid' : 'pending';
    
    await updateDoc(paymentRef, {
      'cash.collectedBy': walkerId,
      'cash.collectorConfirm': collectorConfirm,
      'cash.wandererConfirm': wandererConfirm,
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating cash payment:', error);
    throw error;
  }
};

/**
 * Get payment record
 */
export const getPaymentRecord = async (paymentId: string): Promise<PaymentRecord | null> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    
    if (paymentSnap.exists()) {
      return paymentSnap.data() as PaymentRecord;
    }
    return null;
  } catch (error) {
    console.error('Error fetching payment record:', error);
    return null;
  }
};

/**
 * Get payments for a request
 */
export const getPaymentsByRequest = async (requestId: string): Promise<PaymentRecord[]> => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('requestId', '==', requestId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data() as PaymentRecord);
  } catch (error) {
    console.error('Error fetching payments by request:', error);
    return [];
  }
};

/**
 * Generate UPI deeplink
 */
export const generateUPIDeeplink = (
  vpa: string,
  name: string,
  amount: number,
  txnRef: string,
  note: string = 'Walk Payment'
): string => {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
    tr: txnRef,
  });
  
  return `upi://pay?${params.toString()}`;
};

/**
 * Generate transaction reference
 */
export const generateTxnRef = (requestId: string): string => {
  const timestamp = Date.now();
  return `MM-${requestId.substring(0, 8)}-${timestamp}`;
};
