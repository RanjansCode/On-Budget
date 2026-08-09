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
  writeBatch,
  addDoc
} from 'firebase/firestore';

import { db } from './config';
import { auth } from './auth';
import { Product, Category, Reel, NotificationItem, ADMIN_EMAILS, UserProfile, AnalyticsData } from '../types';
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

// --- IN-MEMORY & LOCALSTORAGE CACHE LAYER ---
const MEMORY_CACHE: Record<string, { data: any; timestamp: number }> = {};
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

function getCachedData<T>(key: string, ttl = DEFAULT_CACHE_TTL_MS): T | null {
  const now = Date.now();
  if (MEMORY_CACHE[key] && now - MEMORY_CACHE[key].timestamp < ttl) {
    return MEMORY_CACHE[key].data as T;
  }
  try {
    const raw = localStorage.getItem(`onbudget_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && now - parsed.timestamp < ttl) {
        MEMORY_CACHE[key] = { data: parsed.data, timestamp: parsed.timestamp };
        return parsed.data as T;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function setCachedData<T>(key: string, data: T) {
  const now = Date.now();
  MEMORY_CACHE[key] = { data, timestamp: now };
  try {
    localStorage.setItem(`onbudget_cache_${key}`, JSON.stringify({ data, timestamp: now }));
  } catch {
    // Ignore storage write errors
  }
}

// --- DB SEEDING FUNCTION ---
export async function seedDatabaseIfEmpty() {
  const isAdminUser = !!(auth.currentUser && (
    (auth.currentUser.email && ADMIN_EMAILS.includes(auth.currentUser.email))
  ));
  
  // Normal visitors skip seeding check to avoid 1 extra query per pageview
  if (!isAdminUser) {
    return;
  }

  const productsRef = collection(db, 'products');
  try {
    const productsSnapshot = await getDocs(productsRef);

    if (productsSnapshot.empty) {
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
    }
  } catch (err) {
    console.warn('Skipping database seeding check due to error/permissions:', err);
  }
}

// --- PRODUCTS API ---
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  const cached = getCachedData<Product[]>('products');
  if (cached && cached.length > 0) {
    // Return cached immediately; fetch fresh in background
    fetchProductsFresh().then(fresh => {
      if (fresh && fresh.length > 0) {
        setCachedData('products', fresh);
      }
    }).catch(() => {});
    return cached;
  }

  return fetchProductsFresh();
}

async function fetchProductsFresh(): Promise<Product[]> {
  try {
    const isUserAdmin = !!(
      auth.currentUser &&
      auth.currentUser.email &&
      ADMIN_EMAILS.includes(auth.currentUser.email)
    );
    
    const q = isUserAdmin 
      ? collection(db, 'products') 
      : query(collection(db, 'products'), where('status', '==', 'Published'));
      
    const productsSnapshot = await getDocs(q);
    const items: Product[] = [];
    productsSnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Product);
    });
    
    const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sorted.length > 0) {
      setCachedData('products', sorted);
    }
    return sorted.length > 0 ? sorted : INITIAL_PRODUCTS;
  } catch (err) {
    console.warn('Firestore fetch products fallback to initial products:', err);
    return INITIAL_PRODUCTS;
  }
}

export async function addProductToFirestore(product: Product) {
  try {
    await setDoc(doc(db, 'products', product.id), cleanData(product));
    delete MEMORY_CACHE['products'];
    localStorage.removeItem('onbudget_cache_products');
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `products/${product.id}`);
  }
}

export async function updateProductInFirestore(product: Product) {
  try {
    await setDoc(doc(db, 'products', product.id), cleanData(product));
    delete MEMORY_CACHE['products'];
    localStorage.removeItem('onbudget_cache_products');
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
  }
}

export async function deleteProductFromFirestore(productId: string) {
  try {
    await deleteDoc(doc(db, 'products', productId));
    delete MEMORY_CACHE['products'];
    localStorage.removeItem('onbudget_cache_products');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
  }
}

// --- CATEGORIES API ---
export async function fetchCategoriesFromFirestore(): Promise<Category[]> {
  const cached = getCachedData<Category[]>('categories');
  if (cached && cached.length > 0) return cached;

  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const items: Category[] = [];
    categoriesSnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Category);
    });
    if (items.length > 0) {
      setCachedData('categories', items);
      return items;
    }
    return INITIAL_CATEGORIES;
  } catch (err) {
    console.warn('Firestore fetch categories fallback to initial categories:', err);
    return INITIAL_CATEGORIES;
  }
}

export async function addCategoryToFirestore(category: Category) {
  try {
    await setDoc(doc(db, 'categories', category.id), cleanData(category));
    delete MEMORY_CACHE['categories'];
    localStorage.removeItem('onbudget_cache_categories');
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `categories/${category.id}`);
  }
}

export async function updateCategoryInFirestore(category: Category) {
  try {
    await setDoc(doc(db, 'categories', category.id), cleanData(category));
    delete MEMORY_CACHE['categories'];
    localStorage.removeItem('onbudget_cache_categories');
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `categories/${category.id}`);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string) {
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
    delete MEMORY_CACHE['categories'];
    localStorage.removeItem('onbudget_cache_categories');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
  }
}

// --- REELS API ---
export async function fetchReelsFromFirestore(): Promise<Reel[]> {
  const cached = getCachedData<Reel[]>('reels');
  if (cached && cached.length > 0) return cached;

  try {
    const reelsSnapshot = await getDocs(collection(db, 'reels'));
    const items: Reel[] = [];
    reelsSnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Reel);
    });
    if (items.length > 0) {
      setCachedData('reels', items);
      return items;
    }
    return INITIAL_REELS;
  } catch (err) {
    console.warn('Firestore fetch reels fallback to initial reels:', err);
    return INITIAL_REELS;
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
    console.warn(`Firestore offline or unavailable for wishlist fetch (${userId}):`, err);
    return [];
  }
}

export async function saveWishlistToFirestore(userId: string, productIds: string[]) {
  try {
    await setDoc(doc(db, 'wishlists', userId), cleanData({ userId, productIds }));
  } catch (err) {
    console.warn(`Firestore offline or unavailable for wishlist save (${userId}):`, err);
  }
}

// --- NOTIFICATIONS API ---
export async function fetchNotificationsFromFirestore(): Promise<NotificationItem[]> {
  const cached = getCachedData<NotificationItem[]>('notifications');
  if (cached && cached.length > 0) return cached;

  try {
    const snapshot = await getDocs(collection(db, 'notifications'));
    const items: NotificationItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as NotificationItem);
    });
    if (items.length > 0) {
      setCachedData('notifications', items);
    }
    return items;
  } catch (err) {
    console.warn('Failed to fetch notifications from Firestore:', err);
    return [];
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
export async function syncUserProfile(user: any): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);
    const isAdminUser = !!(
      (user.email && ADMIN_EMAILS.includes(user.email))
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

// --- REAL ANALYTICS API ---

export async function trackVisitorInFirestore(sessionId: string, device: string) {
  try {
    const trackedKey = `onbudget_tracked_${sessionId}`;
    if (sessionStorage.getItem(trackedKey)) {
      return; // Already tracked for this session
    }
    sessionStorage.setItem(trackedKey, 'true');

    await setDoc(doc(db, 'visitors', sessionId), {
      timestamp: new Date().toISOString(),
      device: device || 'Desktop',
      country: 'India',
    });
  } catch (err) {
    console.error('Failed to track visitor in Firestore:', err);
  }
}

export async function trackClickInFirestore(type: 'view' | 'affiliate', productId: string, platform?: string, category?: string, title?: string) {
  try {
    await addDoc(collection(db, 'clicks'), {
      type,
      productId,
      platform: platform || '',
      category: category || '',
      title: title || '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().substring(5, 10), // 'MM-DD'
    });
  } catch (err) {
    console.error('Failed to track click in Firestore:', err);
  }
}

export async function fetchAnalyticsFromFirestore(): Promise<AnalyticsData> {
  const defaultAnalytics: AnalyticsData = {
    totalVisitors: 0,
    pageViews: 0,
    averageTime: 0,
    bounceRate: 0,
    devices: [],
    countries: [],
    affiliateClicks: [],
    topCategories: [],
    topProducts: [],
    clicksHistory: []
  };

  const isRealAdmin = !!(
    auth.currentUser &&
    auth.currentUser.email &&
    ADMIN_EMAILS.includes(auth.currentUser.email)
  );

  if (!isRealAdmin) {
    return defaultAnalytics;
  }

  try {
    const [visitorsSnap, clicksSnap] = await Promise.all([
      getDocs(collection(db, 'visitors')),
      getDocs(collection(db, 'clicks'))
    ]);

    const totalVisitors = visitorsSnap.size;
    let viewsCount = 0;
    let affsCount = 0;

    // Devices & Countries maps
    const deviceMap: { [key: string]: number } = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const countryMap: { [key: string]: number } = { India: 0 };

    visitorsSnap.forEach(docSnap => {
      const data = docSnap.data();
      const dev = data.device || 'Desktop';
      if (deviceMap[dev] !== undefined) {
        deviceMap[dev]++;
      } else {
        deviceMap[dev] = 1;
      }
      const c = data.country || 'India';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });

    const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));
    const countries = Object.entries(countryMap).map(([country, count]) => ({ country, count }));

    // Clicks metrics
    const platformMap: { [key: string]: number } = { Amazon: 0, Meesho: 0, Flipkart: 0, Croma: 0, Myntra: 0 };
    const categoryMap: { [key: string]: number } = {};
    const productMap: { [key: string]: { title: string; clicks: number } } = {};

    // Get last 7 days keys
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${mm}-${dd}`);
    }

    const historyMap: { [key: string]: number } = {};
    dates.forEach(date => { historyMap[date] = 0; });

    clicksSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.type === 'view') {
        viewsCount++;
        if (data.category) {
          categoryMap[data.category] = (categoryMap[data.category] || 0) + 1;
        }
        if (data.productId && data.title) {
          if (!productMap[data.productId]) {
            productMap[data.productId] = { title: data.title, clicks: 0 };
          }
          productMap[data.productId].clicks++;
        }
      } else if (data.type === 'affiliate') {
        affsCount++;
        if (data.platform) {
          platformMap[data.platform] = (platformMap[data.platform] || 0) + 1;
        }
      }

      if (data.date && historyMap[data.date] !== undefined) {
        historyMap[data.date]++;
      }
    });

    const pageViews = totalVisitors + viewsCount;
    const averageTime = viewsCount > 0 ? Math.round(30 + (viewsCount / (totalVisitors || 1)) * 45) : 0;
    const bounceRate = totalVisitors > 0 ? Math.max(10, Math.min(90, Math.round(100 - (viewsCount / totalVisitors) * 35))) : 0;

    const affiliateClicks = Object.entries(platformMap).map(([platform, clicks]) => ({ platform, clicks }));
    const topCategories = Object.entries(categoryMap)
      .map(([category, clicks]) => ({ category, clicks }))
      .sort((a, b) => b.clicks - a.clicks);
    const topProducts = Object.entries(productMap)
      .map(([productId, info]) => ({ productId, title: info.title, clicks: info.clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    const clicksHistory = dates.map(date => ({
      date,
      clicks: historyMap[date]
    }));

    return {
      totalVisitors,
      pageViews,
      averageTime,
      bounceRate,
      devices,
      countries,
      affiliateClicks,
      topCategories,
      topProducts,
      clicksHistory
    };

  } catch (err) {
    console.error('Failed to fetch analytics from Firestore:', err);
    return defaultAnalytics;
  }
}

export interface LaunchSettings {
  id: string;
  enabled: boolean;
  launchDate: string;
  launchTime: string;
  timezone: string;
  updatedAt: string;
}

const DEFAULT_LAUNCH_SETTINGS: LaunchSettings = {
  id: 'launch',
  enabled: false,
  launchDate: '2026-08-01',
  launchTime: '12:00',
  timezone: '+05:30',
  updatedAt: new Date().toISOString()
};

export async function fetchLaunchSettingsFromFirestore(): Promise<LaunchSettings> {
  try {
    const docRef = doc(db, 'settings', 'launch');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LaunchSettings;
    }
    await setDoc(docRef, cleanData(DEFAULT_LAUNCH_SETTINGS));
    return DEFAULT_LAUNCH_SETTINGS;
  } catch (err) {
    console.warn('Failed to fetch launch settings from Firestore, returning defaults:', err);
    return DEFAULT_LAUNCH_SETTINGS;
  }
}

export async function saveLaunchSettingsToFirestore(settings: LaunchSettings) {
  try {
    const docRef = doc(db, 'settings', 'launch');
    await setDoc(docRef, cleanData({
      ...settings,
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/launch');
  }
}

