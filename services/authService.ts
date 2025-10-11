import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User 
  } from 'firebase/auth';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import { auth, db } from '../firebaseConfig';
  
  export const authService = {
    // Sign up new user
    async signUp(email: string, password: string, userData: {
      name: string;
      phone: string;
      role: 'wanderer' | 'walker';
    }) {
      try {
        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        // Create user document in Firestore
        const userDoc = {
          uid: user.uid,
          name: userData.name,
          email: email,
          phone: userData.phone,
          role: userData.role,
          approved: userData.role === 'wanderer' ? true : false, // Wanderers auto-approved, Walkers need approval
          createdAt: new Date(),
        };
  
        await setDoc(doc(db, 'users', user.uid), userDoc);
        return { success: true, user };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  
    // Sign in existing user
    async signIn(email: string, password: string) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  
    // Sign out
    async signOut() {
      try {
        await signOut(auth);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  };
  