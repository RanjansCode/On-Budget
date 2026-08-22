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
import {
  Product,
  Category,
  Reel,
  NotificationItem,
  ADMIN_EMAILS,
  UserProfile,
  AnalyticsData,
  PromotionalBanner,
  Retailer,
  HomepageSectionVisibility,
  HomepageSectionsSettings,
  HomepageSectionConfig,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_SECTIONS_CONFIG
} from '../types';
import { User } from 'firebase/auth';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_REELS, INITIAL_PROMOTIONAL_BANNERS, INITIAL_RETAILERS } from '../data';
import { sortProductsByNewest } from '../utils/productSorting';

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

      // 5. Seed Promotional Banners
      for (const banner of INITIAL_PROMOTIONAL_BANNERS) {
        try {
          await setDoc(doc(db, 'promotional_banners', banner.id), cleanData(banner));
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `promotional_banners/${banner.id}`);
        }
      }

      // 6. Seed Master Retailers
      for (const retailer of INITIAL_RETAILERS) {
        try {
          await setDoc(doc(db, 'retailers', retailer.id), cleanData(retailer));
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `retailers/${retailer.id}`);
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
    
    const sorted = sortProductsByNewest(items);
    if (sorted.length > 0) {
      setCachedData('products', sorted);
    }
    const defaultInitial = sortProductsByNewest(INITIAL_PRODUCTS);
    return sorted.length > 0 ? sorted : defaultInitial;
  } catch (err) {
    console.warn('Firestore fetch products fallback to initial products:', err);
    return sortProductsByNewest(INITIAL_PRODUCTS);
  }
}

export async function addProductToFirestore(product: Product) {
  try {
    const productToSave: Product = {
      ...product,
      createdAt: product.createdAt || new Date().toISOString()
    };
    await setDoc(doc(db, 'products', productToSave.id), cleanData(productToSave));
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
  partyPopperEnabled?: boolean;
  updatedAt: string;
}

const DEFAULT_LAUNCH_SETTINGS: LaunchSettings = {
  id: 'launch',
  enabled: false,
  launchDate: '2026-08-01',
  launchTime: '12:00',
  timezone: '+05:30',
  partyPopperEnabled: true,
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

// --- PROMOTIONAL BANNERS API ---
export async function fetchPromotionalBannersFromFirestore(): Promise<PromotionalBanner[]> {
  const cached = getCachedData<PromotionalBanner[]>('promotional_banners');
  if (cached && cached.length > 0) return cached;

  try {
    const bannersSnapshot = await getDocs(collection(db, 'promotional_banners'));
    const items: PromotionalBanner[] = [];
    bannersSnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as PromotionalBanner);
    });
    
    // Sort by displayOrder ascending
    const sorted = items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    
    if (sorted.length > 0) {
      setCachedData('promotional_banners', sorted);
      return sorted;
    }
    return INITIAL_PROMOTIONAL_BANNERS;
  } catch (err) {
    console.warn('Firestore fetch promotional banners fallback to initial banners:', err);
    return INITIAL_PROMOTIONAL_BANNERS;
  }
}

export async function addPromotionalBannerToFirestore(banner: PromotionalBanner) {
  try {
    // If promotional_banners collection is empty in Firestore, seed INITIAL_PROMOTIONAL_BANNERS first
    const bannersSnapshot = await getDocs(collection(db, 'promotional_banners'));
    if (bannersSnapshot.empty) {
      for (const initBanner of INITIAL_PROMOTIONAL_BANNERS) {
        if (initBanner.id !== banner.id) {
          await setDoc(doc(db, 'promotional_banners', initBanner.id), cleanData(initBanner));
        }
      }
    }
    await setDoc(doc(db, 'promotional_banners', banner.id), cleanData(banner));
    delete MEMORY_CACHE['promotional_banners'];
    localStorage.removeItem('onbudget_cache_promotional_banners');
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `promotional_banners/${banner.id}`);
  }
}

export async function updatePromotionalBannerInFirestore(banner: PromotionalBanner) {
  try {
    await setDoc(doc(db, 'promotional_banners', banner.id), cleanData(banner));
    delete MEMORY_CACHE['promotional_banners'];
    localStorage.removeItem('onbudget_cache_promotional_banners');
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `promotional_banners/${banner.id}`);
  }
}

export async function deletePromotionalBannerFromFirestore(bannerId: string) {
  try {
    await deleteDoc(doc(db, 'promotional_banners', bannerId));
    delete MEMORY_CACHE['promotional_banners'];
    localStorage.removeItem('onbudget_cache_promotional_banners');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `promotional_banners/${bannerId}`);
  }
}

export async function reorderPromotionalBannersInFirestore(banners: PromotionalBanner[]) {
  try {
    const batch = writeBatch(db);
    banners.forEach((banner, index) => {
      const bannerRef = doc(db, 'promotional_banners', banner.id);
      batch.update(bannerRef, { displayOrder: index + 1, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
    delete MEMORY_CACHE['promotional_banners'];
    localStorage.removeItem('onbudget_cache_promotional_banners');
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'promotional_banners');
  }
}

// --- RETAILERS API ---
export async function fetchRetailersFromFirestore(): Promise<Retailer[]> {
  const cached = getCachedData<Retailer[]>('retailers');
  if (cached && cached.length > 0) return cached;

  try {
    const snapshot = await getDocs(collection(db, 'retailers'));
    const items: Retailer[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Retailer);
    });

    if (items.length > 0) {
      setCachedData('retailers', items);
      return items;
    }
    
    // If empty in Firestore, return defaults
    return INITIAL_RETAILERS;
  } catch (err) {
    console.warn('Firestore fetch retailers fallback to initial retailers:', err);
    return INITIAL_RETAILERS;
  }
}

export async function addRetailerToFirestore(retailer: Retailer) {
  try {
    // If collection is empty in Firestore, seed defaults first so all preset retailers persist
    const snapshot = await getDocs(collection(db, 'retailers'));
    if (snapshot.empty) {
      for (const initRet of INITIAL_RETAILERS) {
        if (initRet.id !== retailer.id) {
          await setDoc(doc(db, 'retailers', initRet.id), cleanData(initRet));
        }
      }
    }
    await setDoc(doc(db, 'retailers', retailer.id), cleanData(retailer));
    delete MEMORY_CACHE['retailers'];
    localStorage.removeItem('onbudget_cache_retailers');
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `retailers/${retailer.id}`);
  }
}

export async function updateRetailerInFirestore(retailer: Retailer) {
  try {
    await setDoc(doc(db, 'retailers', retailer.id), cleanData(retailer));
    delete MEMORY_CACHE['retailers'];
    localStorage.removeItem('onbudget_cache_retailers');
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `retailers/${retailer.id}`);
  }
}

export async function deleteRetailerFromFirestore(retailerId: string) {
  try {
    await deleteDoc(doc(db, 'retailers', retailerId));
    delete MEMORY_CACHE['retailers'];
    localStorage.removeItem('onbudget_cache_retailers');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `retailers/${retailerId}`);
  }
}

// --- HOMEPAGE SECTIONS CONFIG & BUILDER API ---
export function migrateLegacySectionsToConfig(legacyOrConfig: any): HomepageSectionConfig[] {
  if (Array.isArray(legacyOrConfig) && legacyOrConfig.length > 0) {
    // Ensure all items have valid IDs and proper defaults
    return legacyOrConfig.map((sec, idx) => ({
      ...sec,
      id: sec.id || `custom_${Date.now()}_${idx}`,
      order: typeof sec.order === 'number' ? sec.order : idx + 1,
      status: sec.status || (sec.visible ? 'published' : 'hidden'),
      visible: sec.status === 'published' || sec.visible === true,
      displayStyle: sec.displayStyle || 'carousel',
      productSource: sec.productSource || 'auto',
      maxProducts: sec.maxProducts || 10,
    }));
  }

  // If object with customSections array
  if (legacyOrConfig && Array.isArray(legacyOrConfig.customSections)) {
    return legacyOrConfig.customSections;
  }

  // If legacy boolean map: { trendingToday: true, ... }
  const legacyMap = (legacyOrConfig?.sections || legacyOrConfig || {}) as Record<string, boolean>;
  return DEFAULT_HOMEPAGE_SECTIONS_CONFIG.map((sec, idx) => {
    const key = sec.builtInKey || sec.id;
    const isVisible = legacyMap[key] !== undefined ? legacyMap[key] : true;
    return {
      ...sec,
      order: idx + 1,
      visible: isVisible,
      status: isVisible ? 'published' : 'hidden',
    };
  });
}

export async function fetchHomepageSectionsConfigFromFirestore(): Promise<HomepageSectionConfig[]> {
  const cached = getCachedData<HomepageSectionConfig[]>('homepage_sections_config');
  if (cached && Array.isArray(cached) && cached.length > 0) return cached;

  try {
    const docRef = doc(db, 'settings', 'homepage_sections');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const raw = data.customSections || data.sections || data;
      const config = migrateLegacySectionsToConfig(raw);
      setCachedData('homepage_sections_config', config);
      return config;
    }
    // Seed default settings doc if missing
    await setDoc(docRef, cleanData({
      id: 'homepage_sections',
      customSections: DEFAULT_HOMEPAGE_SECTIONS_CONFIG,
      sections: DEFAULT_HOMEPAGE_SECTIONS,
      updatedAt: new Date().toISOString()
    }));
    setCachedData('homepage_sections_config', DEFAULT_HOMEPAGE_SECTIONS_CONFIG);
    return DEFAULT_HOMEPAGE_SECTIONS_CONFIG;
  } catch (err) {
    console.warn('Failed to fetch homepage sections config from Firestore, returning defaults:', err);
    return DEFAULT_HOMEPAGE_SECTIONS_CONFIG;
  }
}

export async function saveHomepageSectionsConfigToFirestore(sections: HomepageSectionConfig[]) {
  try {
    const docRef = doc(db, 'settings', 'homepage_sections');
    // Also build a backward-compatible legacy boolean map for built-in sections
    const legacyMap: Record<string, boolean> = { ...DEFAULT_HOMEPAGE_SECTIONS };
    sections.forEach(s => {
      if (s.isBuiltIn && s.builtInKey) {
        legacyMap[s.builtInKey] = s.status === 'published' && s.visible !== false;
      }
    });

    await setDoc(docRef, cleanData({
      id: 'homepage_sections',
      customSections: sections,
      sections: legacyMap,
      updatedAt: new Date().toISOString()
    }));
    setCachedData('homepage_sections_config', sections);
    delete MEMORY_CACHE['homepage_sections'];
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/homepage_sections');
  }
}

// Backward-compatible alias
export async function fetchHomepageSectionsFromFirestore(): Promise<HomepageSectionConfig[]> {
  return fetchHomepageSectionsConfigFromFirestore();
}

export async function saveHomepageSectionsToFirestore(sections: HomepageSectionConfig[] | HomepageSectionVisibility) {
  if (Array.isArray(sections)) {
    return saveHomepageSectionsConfigToFirestore(sections);
  }
  const config = migrateLegacySectionsToConfig(sections);
  return saveHomepageSectionsConfigToFirestore(config);
}


