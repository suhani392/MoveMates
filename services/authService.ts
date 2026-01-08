import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User,
    GoogleAuthProvider,
    signInWithCredential 
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
  import { auth, db } from '../firebaseConfig';
  
  export const authService = {
    // Sign up new user
    async signUp(email: string, password: string, userData: {
      name: string;
      phone: string;
      role: 'wanderer' | 'walker';
      age?: number;
      walkingPace?: string;
      hobbies?: string;
      languages?: string;
      about?: string;
      pricePerHour?: number;
      experience?: string;
      documents?: string[];
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
          // Profile details
          age: userData.age,
          walkingPace: userData.walkingPace,
          hobbies: userData.hobbies,
          languages: userData.languages,
          about: userData.about,
          ...(userData.role === 'walker' && {
            pricePerHour: userData.pricePerHour,
            experience: userData.experience,
            documents: userData.documents,
          }),
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
        const user = auth.currentUser;
        if (user) {
          // Set user as offline before signing out
          await updateDoc(doc(db, 'users', user.uid), {
            isOnline: false,
          }).catch(() => {});
        }
        await signOut(auth);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    // Sign in with Google credential (works for both login and first-time signup)
    async signInWithGoogleCredential(idToken: string, accessToken?: string) {
      try {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        const { user } = await signInWithCredential(auth, credential);

        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const displayName = user.displayName || '';
          const [first, ...rest] = displayName.split(' ');
          const name = displayName || user.email || 'User';
          const userDoc = {
            uid: user.uid,
            name,
            email: user.email || '',
            phone: user.phoneNumber || '',
            role: 'wanderer',
            approved: true,
            createdAt: new Date(),
            profileImage: user.photoURL || undefined,
          };
          await setDoc(userRef, userDoc);
        }
        return { success: true, user };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  };