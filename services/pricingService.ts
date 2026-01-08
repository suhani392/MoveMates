import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface PricingConfig {
  baseFare: number;
  perMinute: number;
  perKm: number;
  commissionRate: number;
  currency: string;
  platformVpa: string;
  platformName: string;
  updatedAt?: any;
}

export interface FareBreakdown {
  baseFare: number;
  perMinute: number;
  perKm: number;
  distanceKm: number;
  durationMinutes: number;
  distanceCharge: number;
  timeCharge: number;
  subtotal: number;
  tip: number;
  total: number;
  commission: number;
  walkerEarnings: number;
}

const DEFAULT_CONFIG: PricingConfig = {
  baseFare: 50,
  perMinute: 5,
  perKm: 8,
  commissionRate: 0.25,
  currency: 'INR',
  platformVpa: 'sahilpranjale2005@oksbi',
  platformName: 'MoveMates',
};

/**
 * Fetch active pricing configuration from Firestore
 */
export const fetchPricingConfig = async (): Promise<PricingConfig> => {
  try {
    const configRef = doc(db, 'pricing_config', 'default');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return configSnap.data() as PricingConfig;
    } else {
      // Create default config if it doesn't exist
      await setDoc(configRef, {
        ...DEFAULT_CONFIG,
        updatedAt: serverTimestamp(),
      });
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * Calculate fare breakdown
 */
export const calculateFare = (
  distanceMeters: number,
  durationMinutes: number,
  tip: number,
  config: PricingConfig
): FareBreakdown => {
  const distanceKm = distanceMeters / 1000;
  
  const distanceCharge = Math.round(config.perKm * distanceKm);
  const timeCharge = Math.round(config.perMinute * durationMinutes);
  const subtotal = config.baseFare + distanceCharge + timeCharge;
  
  // Commission is on subtotal only (not on tip)
  const commission = Math.round(subtotal * config.commissionRate);
  
  // Total includes tip
  const total = subtotal + tip;
  
  // Walker gets: subtotal - commission + full tip
  const walkerEarnings = subtotal - commission + tip;
  
  return {
    baseFare: config.baseFare,
    perMinute: config.perMinute,
    perKm: config.perKm,
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    durationMinutes,
    distanceCharge,
    timeCharge,
    subtotal,
    tip,
    total,
    commission,
    walkerEarnings,
  };
};

/**
 * Update pricing configuration (admin only)
 */
export const updatePricingConfig = async (config: Partial<PricingConfig>): Promise<void> => {
  try {
    const configRef = doc(db, 'pricing_config', 'default');
    await setDoc(configRef, {
      ...config,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating pricing config:', error);
    throw error;
  }
};
