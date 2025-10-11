import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA2KUbTfecc0Av02F_9gLM7rVcdasPF8gM",
  authDomain: "movemates07.firebaseapp.com",
  projectId: "movemates07",
  storageBucket: "movemates07.firebasestorage.app",
  messagingSenderId: "641694306145",
  appId: "1:641694306145:web:b9e0138c8573774cfb3f20",
  measurementId: "G-LFRX6B2TQF"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);