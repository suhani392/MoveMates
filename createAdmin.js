import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@movemates.com', 
      'admin123456'
    );
    
    // Create admin document
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      name: 'Admin User',
      email: 'admin@movemates.com',
      role: 'admin',
      approved: true,
      createdAt: new Date(),
    });
    
    console.log('Admin user created successfully!');
    console.log('Email: admin@movemates.com');
    console.log('Password: admin123456');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin();