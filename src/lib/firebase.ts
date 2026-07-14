// -----------------------------------------------------------------------------
// Backwards Compatibility Adapter
// Re-exports all Firebase resources and services from the modular /src/firebase
// directory structure.
// -----------------------------------------------------------------------------

export { auth, googleProvider, onAuthStateChanged, RecaptchaVerifier, sendOtpToPhone } from '../firebase/auth';
export type { User, ConfirmationResult } from '../firebase/auth';
export { db, isFirebaseConfigured } from '../firebase/config';

export {
  OperationType,
  handleFirestoreError,
  cleanData,
  seedDatabaseIfEmpty,
  fetchProductsFromFirestore,
  addProductToFirestore,
  updateProductInFirestore,
  deleteProductFromFirestore,
  fetchCategoriesFromFirestore,
  addCategoryToFirestore,
  updateCategoryInFirestore,
  deleteCategoryFromFirestore,
  fetchReelsFromFirestore,
  addReelToFirestore,
  updateReelInFirestore,
  deleteReelFromFirestore,
  fetchWishlistFromFirestore,
  saveWishlistToFirestore,
  fetchNotificationsFromFirestore,
  markNotificationsAsReadInFirestore,
  subscribeNewsletterInFirestore,
  syncUserProfile,
} from '../firebase/firestore';

export {
  uploadFileToStorage,
  deleteFileFromStorage,
} from '../firebase/storage';
