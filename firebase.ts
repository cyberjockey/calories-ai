
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './config';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);

export const auth = getAuth(app);
auth.useDeviceLanguage();

export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

export default app;