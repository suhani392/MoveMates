const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyA2KUbTfecc0Av02F_9gLM7rVcdasPF8gM",
  authDomain: "movemates07.firebaseapp.com",
  projectId: "movemates07",
  storageBucket: "movemates07.appspot.com",
  messagingSenderId: "641694306145",
  appId: "1:641694306145:web:b9e0138c8573774cfb3f20",
  measurementId: "G-LFRX6B2TQF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializePricing() {
  try {
    const pricingRef = doc(db, 'pricing_config', 'default');
    
    const pricingData = {
      baseFare: 50,
      perMinute: 5,
      perKm: 8,
      commissionRate: 0.25,
      currency: 'INR',
      platformVpa: 'sahilpranjale2005@oksbi',
      platformName: 'MoveMates',
      updatedAt: serverTimestamp(),
    };

    await setDoc(pricingRef, pricingData);
    
    console.log('✅ Pricing configuration initialized successfully!');
    console.log('Configuration:');
    console.log('  Base Fare: ₹' + pricingData.baseFare);
    console.log('  Per Minute: ₹' + pricingData.perMinute);
    console.log('  Per Km: ₹' + pricingData.perKm);
    console.log('  Commission: ' + (pricingData.commissionRate * 100) + '%');
    console.log('  Platform VPA: ' + pricingData.platformVpa);
    console.log('\nExample calculation for 2km in 20 minutes:');
    const distance = 2;
    const duration = 20;
    const distanceCharge = Math.round(pricingData.perKm * distance);
    const timeCharge = Math.round(pricingData.perMinute * duration);
    const subtotal = pricingData.baseFare + distanceCharge + timeCharge;
    const commission = Math.round(subtotal * pricingData.commissionRate);
    const walkerEarnings = subtotal - commission;
    
    console.log('  Base: ₹' + pricingData.baseFare);
    console.log('  Time: ₹' + timeCharge + ' (' + pricingData.perMinute + ' × ' + duration + ' min)');
    console.log('  Distance: ₹' + distanceCharge + ' (' + pricingData.perKm + ' × ' + distance + ' km)');
    console.log('  Subtotal: ₹' + subtotal);
    console.log('  Commission (25%): ₹' + commission);
    console.log('  Walker Earnings: ₹' + walkerEarnings);
    console.log('  Total to Pay: ₹' + subtotal);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing pricing:', error);
    process.exit(1);
  }
}

initializePricing();
