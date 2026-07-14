import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

import { db } from './config';
import { auth } from './auth';
import { Product, Category, Reel, NotificationItem, ADMIN_EMAILS, ADMIN_PHONES, UserProfile } from '../types';
import { User } from 'firebase/auth';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_REELS } from '../data';

// --- FIRESTORE ERROR HANDLING ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to recursively strip any undefined properties so Firestore doesn't crash
export function cleanData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// --- DB SEEDING FUNCTION ---
export async function seedDatabaseIfEmpty() {
  const productsRef = collection(db, 'products');
  let productsSnapshot;
  try {
    const isAdminUser = !!(auth.currentUser && (
      (auth.currentUser.email && ADMIN_EMAILS.includes(auth.currentUser.email)) ||
      (auth.currentUser.phoneNumber && ADMIN_PHONES.includes(auth.currentUser.phoneNumber))
    ));
    const q = isAdminUser 
      ? productsRef 
      : query(productsRef, where('status', '==', 'Published'));
    productsSnapshot = await getDocs(q);

    if (productsSnapshot.empty) {
      if (isAdminUser) {
        console.log('Seeding products, categories, and reels to Firestore...');
        
        // 1. Seed Categories
        for (const cat of INITIAL_CATEGORIES) {
          try {
            await setDoc(doc(db, 'categories', cat.id), cleanData(cat));
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `categories/${cat.id}`);
          }
        }

        // 2. Seed Products
        for (const prod of INITIAL_PRODUCTS) {
          try {
            await setDoc(doc(db, 'products', prod.id), cleanData(prod));
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`);
          }
        }

        // 3. Seed Reels
        for (const reel of INITIAL_REELS) {
          try {
            await setDoc(doc(db, 'reels', reel.id), cleanData(reel));
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `reels/${reel.id}`);
          }
        }

        // 4. Seed Default Notifications
        const defaultNotifs: NotificationItem[] = [
          { id: 'n-1', title: '🚨 Epic Coupon Unlocked!', description: 'Use code GALAXY100 to get an extra ₹100 off the Astronaut Galaxy Star Projector!', type: 'deal', date: 'Just now', read: false },
          { id: 'n-2', title: '📉 Price Drop Alert!', description: 'Sleek Flat Felt Desk Mat dropped from ₹389 to ₹349! Buy now before stock runs out.', type: 'price_drop', date: '3 hours ago', read: false },
          { id: 'n-3', title: '🔥 Viral Trend Tracker', description: 'Sunset Projection Lamp is exploding on Instagram Reels. 15,000+ views in past hour!', type: 'trending', date: '1 day ago', read: false },
        ];
        for (const notif of defaultNotifs) {
          try {
            await setDoc(doc(db, 'notifications', notif.id), cleanData(notif));
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
          }
        }

        console.log('Database successfully seeded!');
      } else {
        console.log('Database is empty, but current user is not admin. Skipping seeding.');
      }
    }
  } catch (err) {
    console.warn('Skipping database seeding check due to error/permissions:', err);
  }
}

// --- PRODUCTS API ---
export async function fetchProductsFromFirestore(isAdminOverride?: boolean): Promise<Product[]> {
  try {
    const isUserAdmin = isAdminOverride !== undefined 
      ? isAdminOverride 
      : !!(auth.currentUser && (
          (auth.currentUser.email && ADMIN_EMAILS.includes(auth.currentUser.email)) ||
          (auth.currentUser.phoneNumber && ADMIN_PHONES.includes(auth.currentUser.phoneNumber))
        ));
    
    const q = isUserAdmin 
      ? collection(db, 'products') 
      : query(collection(db, 'products'), where('status', '==', 'Published'));
      
    const productsSnapshot = await getDocs(q);
    const items: Product[] = [];
    productsSnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Product);
    });
    // Sort by creation date or ID
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'products');
  }
}

export async function addProductToFirestore(product: Product) {
  try {
    await setDoc(doc(db, 'products', product.id), cleanData(product));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `products/${product.id}`);
  }
}

export async function updateProductInFirestore(product: Product) {
  try {
    await setDoc(doc(db, 'products', product.id), cleanData(product));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
  }
}

export async function deleteProductFromFirestore(productId: string) {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
  }
}

// --- CATEGORIES API ---
export async function fetchCategoriesFromFirestore(): Promise<Category[]> {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const items: Category[] = [];
    categoriesSnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Category);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'categories');
  }
}

export async function addCategoryToFirestore(category: Category) {
  try {
    await setDoc(doc(db, 'categories', category.id), cleanData(category));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `categories/${category.id}`);
  }
}

export async function updateCategoryInFirestore(category: Category) {
  try {
    await setDoc(doc(db, 'categories', category.id), cleanData(category));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `categories/${category.id}`);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string) {
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
  }
}

// --- REELS API ---
export async function fetchReelsFromFirestore(): Promise<Reel[]> {
  try {
    const reelsSnapshot = await getDocs(collection(db, 'reels'));
    const items: Reel[] = [];
    reelsSnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Reel);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'reels');
  }
}

export async function addReelToFirestore(reel: Reel) {
  try {
    await setDoc(doc(db, 'reels', reel.id), cleanData(reel));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reels/${reel.id}`);
  }
}

export async function updateReelInFirestore(reel: Reel) {
  try {
    await setDoc(doc(db, 'reels', reel.id), cleanData(reel));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reels/${reel.id}`);
  }
}

export async function deleteReelFromFirestore(reelId: string) {
  try {
    await deleteDoc(doc(db, 'reels', reelId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `reels/${reelId}`);
  }
}

// --- WISHLIST SYNC ---
export async function fetchWishlistFromFirestore(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, 'wishlists', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.productIds || [];
    }
    return [];
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `wishlists/${userId}`);
  }
}

export async function saveWishlistToFirestore(userId: string, productIds: string[]) {
  try {
    await setDoc(doc(db, 'wishlists', userId), cleanData({ userId, productIds }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `wishlists/${userId}`);
  }
}

// --- NOTIFICATIONS API ---
export async function fetchNotificationsFromFirestore(): Promise<NotificationItem[]> {
  try {
    const snapshot = await getDocs(collection(db, 'notifications'));
    const items: NotificationItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as NotificationItem);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'notifications');
  }
}

export async function markNotificationsAsReadInFirestore(notificationIds: string[]) {
  try {
    const batch = writeBatch(db);
    for (const id of notificationIds) {
      batch.update(doc(db, 'notifications', id), { read: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'notifications');
  }
}

// --- NEWSLETTER API ---
export async function subscribeNewsletterInFirestore(email: string) {
  const id = `news-${Date.now()}`;
  try {
    await setDoc(doc(db, 'newsletter', id), cleanData({
      id,
      email,
      subscribedAt: new Date().toISOString()
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `newsletter/${id}`);
  }
}

// --- USER PROFILE API ---
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);
    const isAdminUser = !!(
      (user.email && ADMIN_EMAILS.includes(user.email)) ||
      (user.phoneNumber && ADMIN_PHONES.includes(user.phoneNumber))
    );
    
    const role = isAdminUser ? 'admin' : 'user';
    const now = new Date().toISOString();
    
    let profile: UserProfile;
    if (docSnap.exists()) {
      const existing = docSnap.data();
      profile = {
        uid: user.uid,
        phoneNumber: user.phoneNumber || existing.phoneNumber || '',
        email: user.email || existing.email || '',
        displayName: user.displayName || existing.displayName || '',
        photoURL: user.photoURL || existing.photoURL || '',
        role: role, // Sync the role dynamically
        createdAt: existing.createdAt || now,
        lastLogin: now,
      };
      await updateDoc(userRef, cleanData({ lastLogin: now, role }));
    } else {
      profile = {
        uid: user.uid,
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: role,
        createdAt: now,
        lastLogin: now,
      };
      await setDoc(userRef, cleanData(profile));
    }
    return profile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

