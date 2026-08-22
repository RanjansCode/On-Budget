import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

// -----------------------------------------------------------------------------
// Firebase Configuration & Service Initializations
// -----------------------------------------------------------------------------
// Where to get Firebase config from Firebase Console:
// 1. Go to your Firebase Console (https://console.firebase.google.com/).
// 2. Select your Project.
// 3. Click the Gear Icon (Project Settings) in the left sidebar -> Project Settings.
// 4. In the General tab, scroll down to "Your Apps" section.
// 5. Select your App (Web) to see the SDK setup and configuration details.
// -----------------------------------------------------------------------------

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    // Fallback to process.env
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || appletConfig.apiKey,
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || appletConfig.authDomain,
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || appletConfig.projectId,
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || appletConfig.storageBucket,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || appletConfig.messagingSenderId,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || appletConfig.appId,
};

// Check if any required environment variable is missing or empty
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Ensure initializeApp() runs before getAuth() and auth is guaranteed to be non-null
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore using the configured database ID
const dbId = getEnvVar('VITE_FIREBASE_DATABASE_ID') || appletConfig.firestoreDatabaseId;
export const db = (() => {
  try {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  } catch (err) {
    console.warn('Failed to initialize Firestore with specified database ID, falling back:', err);
    return getFirestore(app);
  }
})();

const auth = getAuth(app);

// Initialize Firebase Storage with explicit bucket formatting and set reasonable retry limits (5s)
// to prevent the SDK from retrying endlessly when bucket is unreachable.
const rawBucket = firebaseConfig.storageBucket;
const storageBucketUrl = rawBucket ? (rawBucket.includes('://') ? rawBucket : `gs://${rawBucket}`) : undefined;
const storage = storageBucketUrl ? getStorage(app, storageBucketUrl) : getStorage(app);

// Configure maximum retry timeouts on Storage instance (5 seconds)
storage.maxUploadRetryTime = 5000;
storage.maxOperationRetryTime = 5000;

export { app, auth, storage };
export default app;
