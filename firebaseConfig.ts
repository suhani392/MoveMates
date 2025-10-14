import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence exists but may not be in type definitions
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA2KUbTfecc0Av02F_9gLM7rVcdasPF8gM",
  authDomain: "movemates07.firebaseapp.com",
  databaseURL: "https://movemates07-default-rtdb.firebaseio.com",
  projectId: "movemates07",
  storageBucket: "movemates07.firebasestorage.app",
  messagingSenderId: "641694306145",
  appId: "1:641694306145:web:b9e0138c8573774cfb3f20",
  measurementId: "G-LFRX6B2TQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
// This ensures the user stays logged in across app restarts
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export const db: Firestore = getFirestore(app);
export const database: Database = getDatabase(app);
