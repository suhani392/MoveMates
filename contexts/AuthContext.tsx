import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'wanderer' | 'walker' | 'admin';
  approved: boolean;
  createdAt: any;
  // Optional profile fields used across the app
  profileImage?: string;
  image?: string;
  updatedAt?: any;
  about?: string;
  languages?: string;
  walkingPace?: string;
  pace?: string;
  hobbies?: string;
  available?: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous Firestore listener when auth user changes
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = undefined;
      }

      if (currentUser) {
        setUser(currentUser);

        // Subscribe to real-time updates on the user's document
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setUserData(snapshot.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to user data:', error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      unsubscribeAuth();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};