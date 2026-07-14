import {
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from './config';

// Re-export standard auth and helpers
export { auth, onAuthStateChanged };
export type { User };

export const googleProvider = new GoogleAuthProvider();

// -----------------------------------------------------------------------------
// Firebase Authentication Configuration Instructions:
// To ensure logins work seamlessly, go to your Firebase Console:
// 1. Go to "Authentication" section in the left sidebar menu.
// 2. Select the "Sign-in method" tab.
// 3. Enable the "Email/Password" provider.
// 4. Enable the "Google" provider and configure the Consent Screen.
// 5. Click Save. If these are disabled, Firebase will return operation-not-allowed.
// -----------------------------------------------------------------------------

/**
 * Translates low-level Firebase Auth errors into clear, beautiful, action-oriented
 * feedback for users and administrative configuration guides.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Authentication is not configured. Please enable Email/Password and Google Sign-In in Firebase Console.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please login instead or reset your password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window closed before completion. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please verify your internet connection and try again.';
    default:
      return error?.message || 'An unexpected error occurred during authentication.';
  }
}

/**
 * Log in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const cred = await firebaseSignInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (error: any) {
    const message = getFriendlyAuthErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  try {
    const cred = await firebaseCreateUserWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (error: any) {
    const message = getFriendlyAuthErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const cred = await firebaseSignInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (error: any) {
    const message = getFriendlyAuthErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Sign out current session
 */
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    const message = getFriendlyAuthErrorMessage(error);
    throw new Error(message);
  }
}
