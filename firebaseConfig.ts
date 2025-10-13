import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';

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

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
// For React Native with Firebase v10+, we use getAuth() directly
// AsyncStorage persistence is handled automatically by the Firebase SDK
let auth: Auth;
try {
  auth = getAuth(app);
} catch (error) {
  // If getAuth fails (app not initialized), initialize auth without custom persistence
  auth = initializeAuth(app);
}

export { auth };
export const db: Firestore = getFirestore(app);
export const database: Database = getDatabase(app);
