import {
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from './config';

// Re-export standard auth and helpers
export { auth, onAuthStateChanged, RecaptchaVerifier };
export type { User, ConfirmationResult };

export const googleProvider = new GoogleAuthProvider();

// -----------------------------------------------------------------------------
// Firebase Authentication Configuration Instructions:
// To ensure Phone logins work seamlessly, go to your Firebase Console:
// 1. Go to "Authentication" section in the left sidebar menu.
// 2. Select the "Sign-in method" tab.
// 3. Enable the "Email/Password", "Google", and "Phone" providers.
// 4. In "Phone" provider settings, make sure to add testing phone numbers if needed.
// 5. Ensure "Authorized Domains" contains your local and hosted domain.
// 6. Click Save. If these are disabled, Firebase will return operation-not-allowed.
// -----------------------------------------------------------------------------

/**
 * Translates low-level Firebase Auth errors into clear, beautiful, action-oriented
 * feedback for users and administrative configuration guides.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Authentication is not configured. Please enable Email/Password, Google, and Phone Sign-In in Firebase Console.';
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
    case 'auth/invalid-phone-number':
      return 'The phone number you entered is invalid. Please check the number and try again.';
    case 'auth/invalid-verification-code':
      return 'The OTP verification code is incorrect. Please verify and try again.';
    case 'auth/code-expired':
      return 'The OTP verification code has expired. Please request a new code.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for today. Please try again later.';
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
 * Send an OTP to the given phone number using an initialized RecaptchaVerifier.
 */
export async function sendOtpToPhone(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult;
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

