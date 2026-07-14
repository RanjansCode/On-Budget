import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// -----------------------------------------------------------------------------
// Firebase Configuration & Service Initializations
// Ensure settings are enabled in the Firebase Console:
// 1. Authentication -> Sign-in method -> Enable Email/Password and Google.
// 2. Firestore Database -> Rules & Indexes as deployed.
// 3. Storage -> Rules & Bucket settings as deployed.
// -----------------------------------------------------------------------------

// Verify presence of all required Firebase configuration keys
const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
] as const;

const missingKeys = requiredKeys.filter(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingKeys.length > 0) {
  console.error(
    `[Firebase Initialization Warning]: Missing essential config parameters: ${missingKeys.join(', ')}. Please verify firebase-applet-config.json.`
  );
}

// Initialize Firebase App only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize and export services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
