// -----------------------------------------------------------------------------
// Backwards Compatibility Adapter
// Re-exports all Firebase resources and services from the modular /src/firebase
// directory structure.
// -----------------------------------------------------------------------------

export { auth, googleProvider, onAuthStateChanged } from '../firebase/auth';
export type { User } from '../firebase/auth';
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
  trackVisitorInFirestore,
  trackClickInFirestore,
  fetchAnalyticsFromFirestore,
  fetchLaunchSettingsFromFirestore,
  saveLaunchSettingsToFirestore,
} from '../firebase/firestore';

export type { LaunchSettings } from '../firebase/firestore';

export {
  uploadFileToStorage,
  deleteFileFromStorage,
} from '../firebase/storage';
