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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

// Check if any required environment variable is missing or empty
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    // Ensure initializeApp() runs only once
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Support custom/named database ID from applet config
    const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Failed to initialize Firebase with provided environment variables:', error);
  }
} else {
  console.warn(
    '[Firebase Connection Alert]: Environment variables are missing or not configured. ' +
    'The website will display the "Firebase Not Connected" page instead of crashing.'
  );
}

export { app, db, auth, storage };
export default app;
