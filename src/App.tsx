import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Search, MessageSquare, Heart, Bell, User, Layout, ArrowRight, ArrowLeft,
  Star, Laptop, Cpu, BookOpen, AlertCircle, Clock,
  Package, Check, Copy, Flame, ShieldAlert, Play, Send, ChevronRight,
  SlidersHorizontal, CheckCircle2, Award, Zap, RefreshCw, LogOut, Loader2, Instagram
} from 'lucide-react';

import {
  Product, Category, Reel, AnalyticsData, NotificationItem, ADMIN_EMAILS, PromotionalBanner, Retailer
} from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_REELS, INITIAL_PROMOTIONAL_BANNERS, INITIAL_RETAILERS } from './data';
import { registerMasterRetailers } from './utils/retailerLogos';
import {
  slugify,
  getProductSlug,
  extractProductSlugFromPath,
  findProductByIdentifier,
  updateDocumentSEO,
  generateOrganizationSchema,
  generateWebSiteSchema
} from './lib/seo';

import {
  auth,
  db,
  onAuthStateChanged,
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
  fetchPromotionalBannersFromFirestore,
  addPromotionalBannerToFirestore,
  updatePromotionalBannerInFirestore,
  deletePromotionalBannerFromFirestore,
  reorderPromotionalBannersInFirestore,
  fetchRetailersFromFirestore,
  addRetailerToFirestore,
  updateRetailerInFirestore,
  deleteRetailerFromFirestore,
  fetchWishlistFromFirestore,
  saveWishlistToFirestore,
  fetchNotificationsFromFirestore,
  markNotificationsAsReadInFirestore,
  subscribeNewsletterInFirestore,
  User as FirebaseUser,
  isFirebaseConfigured,
  trackVisitorInFirestore,
  trackClickInFirestore,
  fetchAnalyticsFromFirestore,
  fetchLaunchSettingsFromFirestore,
  saveLaunchSettingsToFirestore,
  LaunchSettings,
  signOutUser
} from './lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';

const HomeRecommendationSections = React.lazy(() => import('./components/HomeRecommendationSections'));
import SmartSearchFilters, { SmartFilterState, SortOption } from './components/SmartSearchFilters';
import { getProductBestPrice, getNormalizedRetailerOffers } from './utils/retailerOffers';
import { smartSearchProducts } from './lib/searchEngine';
import Navbar from './components/Navbar';
import CategoryNav from './components/CategoryNav';
import PromotionalCarousel from './components/PromotionalCarousel';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
const ProductDetail = React.lazy(() => import('./components/ProductDetail'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const LaunchModeOverlay = React.lazy(() => import('./components/LaunchModeOverlay'));
const SocialLinksModal = React.lazy(() => import('./components/SocialLinksModal'));
import ScrollToTop from './components/ScrollToTop';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useToast } from './components/Toast';
import { LocationCurrencyBanner } from './components/CurrencySwitcher';
import { calculateDiscount } from './utils/discount';
import { detectUserCurrency, setUserCurrency } from './utils/currency';
import {
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailsSkeleton,
  AdminFormSkeleton,
  WishlistSkeleton,
  CategoryBarSkeleton
} from './components/Skeletons';

export default function App() {
  const [socialModalProduct, setSocialModalProduct] = useState<Product | null>(null);
  const toast = useToast();

  // --- Currency State ---
  const [currentCurrency, setCurrentCurrency] = useState<string>(() => detectUserCurrency().currency.code);

  // --- Firebase User Auth State ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);

  // --- Core Cloud Synchronized States ---
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [reels, setReels] = useState<Reel[]>(INITIAL_REELS);
  const [promotionalBanners, setPromotionalBanners] = useState<PromotionalBanner[]>(INITIAL_PROMOTIONAL_BANNERS);
  const [retailers, setRetailers] = useState<Retailer[]>(INITIAL_RETAILERS);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [visibleCatalogCount, setVisibleCatalogCount] = useState(12);

  // --- Local / Device States ---
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    const local = localStorage.getItem('onbudget_viewed');
    return local ? JSON.parse(local) : [];
  });

  const [newsletterSubscribed, setNewsletterSubscribed] = useState(() => {
    return localStorage.getItem('onbudget_newsletter_active') === 'true';
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [newsletterErrorMessage, setNewsletterErrorMessage] = useState('');

  // Analytics state (synchronized fallback)
  const [analytics, setAnalytics] = useState<AnalyticsData>(() => {
    const local = localStorage.getItem('onbudget_analytics');
    if (local) return JSON.parse(local);

    return {
      totalVisitors: 0,
      pageViews: 0,
      averageTime: 0,
      bounceRate: 0,
      devices: [],
      countries: [],
      affiliateClicks: [
        { platform: 'Amazon', clicks: 0 },
        { platform: 'Meesho', clicks: 0 },
        { platform: 'Flipkart', clicks: 0 },
        { platform: 'Croma', clicks: 0 },
        { platform: 'Myntra', clicks: 0 }
      ],
      topCategories: [],
      topProducts: [],
      clicksHistory: []
    };
  });

  // --- Active Session Navigation States ---
  const [activeTab, setActiveTab] = useState<'home' | 'wishlist' | 'profile' | 'admin'>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path === '/wishlist') return 'wishlist';
    if (path === '/profile') return 'profile';
    return 'home';
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return extractProductSlugFromPath(window.location.pathname);
  });
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [authModalOpenRequested, setAuthModalOpenRequested] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- Launch Mode States ---
  const [launchSettings, setLaunchSettings] = useState<LaunchSettings>({
    id: 'launch',
    enabled: false,
    launchDate: '2026-08-01',
    launchTime: '12:00',
    timezone: '+05:30',
    updatedAt: new Date().toISOString()
  });

  // --- Filter / Sorting States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'tested' | 'recommended' | 'trending'>('all');
  const [sortOption, setSortOption] = useState<'popular' | 'latest' | 'low-price' | 'discount' | 'rating'>('popular');

  // --- Skeleton Loading States ---
  const isFilterLoading = false;
  const isDetailLoading = false;
  const isTabLoading = false;

  // --- Language State ---
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // --- Voice Search status ---
  const [voiceActive, setVoiceActive] = useState(false);

  const isAdmin = !!(currentUser && (
    (currentUser.email && ADMIN_EMAILS.includes(currentUser.email))
  ));

  // Helper to load admin-only datasets asynchronously
  const loadAdminDataset = async () => {
    try {
      const [cloudAnalytics, cloudReels, cloudLaunch] = await Promise.all([
        fetchAnalyticsFromFirestore(),
        fetchReelsFromFirestore(),
        fetchLaunchSettingsFromFirestore()
      ]);
      if (cloudAnalytics) setAnalytics(cloudAnalytics);
      if (cloudReels && cloudReels.length > 0) setReels(cloudReels);
      if (cloudLaunch) setLaunchSettings(cloudLaunch);
    } catch (err) {
      console.warn("Failed to load admin dataset:", err);
    }
  };

  // 1. Non-blocking Database Initialization and Background Sync
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setDbLoading(false);
      return;
    }

    let isMounted = true;

    async function initAndFetch() {
      try {
        // Seed initial collections if empty
        seedDatabaseIfEmpty().catch(() => {});

        // Stage 1: Critical Explore Data (Products, Categories, Promotional Banners, Retailers)
        const [cloudProducts, cloudCategories, cloudBanners, cloudRetailers] = await Promise.all([
          fetchProductsFromFirestore(),
          fetchCategoriesFromFirestore(),
          fetchPromotionalBannersFromFirestore(),
          fetchRetailersFromFirestore()
        ]);

        if (isMounted) {
          if (cloudProducts && cloudProducts.length > 0) setProducts(cloudProducts);
          if (cloudCategories && cloudCategories.length > 0) setCategories(cloudCategories);
          if (cloudBanners && cloudBanners.length > 0) setPromotionalBanners(cloudBanners);
          if (cloudRetailers && cloudRetailers.length > 0) {
            setRetailers(cloudRetailers);
            registerMasterRetailers(cloudRetailers);
          } else {
            registerMasterRetailers(INITIAL_RETAILERS);
          }
        }

        // Stage 2: Non-critical background data (Notifications)
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            const cloudNotifs = await fetchNotificationsFromFirestore();
            if (isMounted && cloudNotifs && cloudNotifs.length > 0) {
              setNotifications(cloudNotifs);
            }
          } catch (e) {
            console.warn('Background notification fetch:', e);
          }
        }, 1200);

      } catch (err) {
        console.error("Failed background Firestore synchronization:", err);
      } finally {
        if (isMounted) setDbLoading(false);
      }
    }

    initAndFetch();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch admin dataset whenever admin status is active
  useEffect(() => {
    if (isAdmin) {
      loadAdminDataset();
    }
  }, [isAdmin]);

  // --- Live Launch Mode Real-Time Listener ---
  useEffect(() => {
    if (!isFirebaseConfigured) {
      const local = localStorage.getItem('onbudget_launch_settings');
      if (local) {
        setLaunchSettings(JSON.parse(local));
      }
      return;
    }

    try {
      const docRef = doc(db, 'settings', 'launch');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setLaunchSettings(docSnap.data() as LaunchSettings);
        }
      }, (error) => {
        console.warn('Launch settings subscription warning:', error);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to launch settings:', err);
    }
  }, []);

  // 2. Real-time Firebase Authentication tracking & Wishlist Sync
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync wishlist from firestore with safe fallback
        try {
          const cloudWish = await fetchWishlistFromFirestore(user.uid);
          if (cloudWish && cloudWish.length > 0) {
            setWishlist(cloudWish);
          } else {
            // Sync any offline local items up to the cloud
            const localWish = localStorage.getItem('onbudget_wishlist');
            const parsed = localWish ? JSON.parse(localWish) : [];
            if (parsed.length > 0) {
              setWishlist(parsed);
              await saveWishlistToFirestore(user.uid, parsed);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch wishlist from Firestore, falling back to local storage:', err);
          const localWish = localStorage.getItem('onbudget_wishlist');
          if (localWish) {
            try { setWishlist(JSON.parse(localWish)); } catch (e) {}
          }
        }

        // If the logged-in user is admin, fetch all products (including drafts)
        const isUserAdmin = !!(
          (user.email && ADMIN_EMAILS.includes(user.email))
        );
        if (isUserAdmin) {
          try {
            const adminProducts = await fetchProductsFromFirestore();
            if (adminProducts && adminProducts.length > 0) {
              setProducts(adminProducts);
            }
          } catch (err) {
            console.error("Failed to load admin products:", err);
          }
        }
      } else {
        // User is logged out, fallback to local storage wishlist
        const localWish = localStorage.getItem('onbudget_wishlist');
        setWishlist(localWish ? JSON.parse(localWish) : []);

        // Re-fetch products with public filter (only published)
        try {
          const publicProducts = await fetchProductsFromFirestore();
          if (publicProducts && publicProducts.length > 0) {
            setProducts(publicProducts);
          }
        } catch (err) {
          console.error("Failed to load public products on logout:", err);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Keep local storage up to date for fallback offline support
  useEffect(() => {
    localStorage.setItem('onbudget_viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem('onbudget_analytics', JSON.stringify(analytics));
  }, [analytics]);

  // Ensure permanent Light Mode
  useEffect(() => {
    window.document.documentElement.classList.remove('dark');
    localStorage.removeItem('onbudget_theme');
  }, []);

  // Centralized Navigation Handler
  const handleNavigate = (tab: 'home' | 'wishlist' | 'profile' | 'admin', pushHistory = true) => {
    if (tab === 'admin') {
      if (!currentUser) {
        if (pushHistory) window.history.pushState({}, '', '/');
        setActiveTab('home');
        setAuthModalOpenRequested(true);
        return;
      }
      const isUserAdmin = !!(currentUser.email && ADMIN_EMAILS.includes(currentUser.email));
      if (!isUserAdmin) {
        if (pushHistory) window.history.pushState({}, '', '/');
        setActiveTab('home');
        setShowAccessDenied(true);
        return;
      }
    }

    setActiveTab(tab);
    setSelectedProductId(null);

    if (pushHistory) {
      const pathMap: Record<string, string> = {
        home: '/',
        wishlist: '/wishlist',
        profile: '/profile',
        admin: '/admin',
      };
      const targetPath = pathMap[tab] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  // --- Client-Side Route Protection and Path Detection ---
  useEffect(() => {
    if (authLoading) return;

    const pathname = window.location.pathname;
    const isUserAdmin = !!(currentUser && (
      (currentUser.email && ADMIN_EMAILS.includes(currentUser.email))
    ));

    const productSlugFromUrl = extractProductSlugFromPath(pathname);

    if (productSlugFromUrl) {
      setSelectedProductId(productSlugFromUrl);
      setActiveTab('home');

      // Normalize URL in browser address bar to canonical format /product/:slug
      const matched = findProductByIdentifier(productSlugFromUrl, products);
      if (matched) {
        const canonicalSlug = getProductSlug(matched);
        const canonicalPath = `/product/${canonicalSlug}`;
        if (pathname !== canonicalPath) {
          window.history.replaceState({}, '', canonicalPath);
        }
      }
    } else if (pathname.startsWith('/admin')) {
      if (!currentUser) {
        window.history.replaceState({}, '', '/');
        setActiveTab('home');
        setAuthModalOpenRequested(true);
      } else if (!isUserAdmin) {
        window.history.replaceState({}, '', '/');
        setActiveTab('home');
        setShowAccessDenied(true);
      } else {
        setActiveTab('admin');
      }
    } else if (activeTab === 'admin' && !isUserAdmin) {
      window.history.replaceState({}, '', '/');
      setActiveTab('home');
    }
  }, [authLoading, currentUser, products]);

  // Handle browser back/forward buttons (Popstate events)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const isUserAdmin = !!(currentUser && (
        (currentUser.email && ADMIN_EMAILS.includes(currentUser.email))
      ));

      const productSlugFromUrl = extractProductSlugFromPath(pathname);

      if (productSlugFromUrl) {
        setSelectedProductId(productSlugFromUrl);
        setActiveTab('home');
      } else if (pathname.startsWith('/admin')) {
        if (!currentUser) {
          window.history.replaceState({}, '', '/');
          setActiveTab('home');
          setAuthModalOpenRequested(true);
        } else if (!isUserAdmin) {
          window.history.replaceState({}, '', '/');
          setActiveTab('home');
          setShowAccessDenied(true);
        } else {
          setActiveTab('admin');
        }
        setSelectedProductId(null);
      } else if (pathname === '/wishlist') {
        setActiveTab('wishlist');
        setSelectedProductId(null);
      } else if (pathname === '/profile') {
        setActiveTab('profile');
        setSelectedProductId(null);
      } else {
        setActiveTab('home');
        setSelectedProductId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // Update dynamic SEO head metadata for Homepage
  useEffect(() => {
    if (activeTab === 'home' && !selectedProductId) {
      const domain = 'https://inourbudget.vercel.app';
      const orgSchema = generateOrganizationSchema(domain);
      const websiteSchema = generateWebSiteSchema(domain);

      updateDocumentSEO({
        title: 'In Our Budget – Find the Best Products at the Right Price',
        description: 'Discover and compare products on In Our Budget. Find useful products, explore categories, save your favorites, and shop smarter within your budget.',
        canonicalUrl: 'https://inourbudget.vercel.app/',
        imageUrl: `${domain}/src/assets/images/in_our_budget_logo_1784107312483.jpg`,
        ogType: 'website',
        jsonLdSchemas: [orgSchema, websiteSchema]
      });
    }
  }, [activeTab, selectedProductId]);

  // Record real live visitor stats in Firestore (deferred to unblock initial paint)
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    
    const trackVisitor = async () => {
      try {
        let sessionId = sessionStorage.getItem('onbudget_session_id');
        const hasBeenTracked = sessionStorage.getItem('onbudget_visitor_tracked') === 'true';
        
        if (!sessionId) {
          sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('onbudget_session_id', sessionId);
        }
        
        if (!hasBeenTracked) {
          const userAgent = navigator.userAgent;
          const isMobile = /Mobi|Android/i.test(userAgent);
          const isTablet = /Tablet|iPad/i.test(userAgent);
          const device = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';
          
          // Track in database
          await trackVisitorInFirestore(sessionId, device);
          sessionStorage.setItem('onbudget_visitor_tracked', 'true');
          
          // Refresh analytics with latest cloud values
          const updatedAnalytics = await fetchAnalyticsFromFirestore();
          if (updatedAnalytics) {
            setAnalytics(updatedAnalytics);
          }
        }
      } catch (err) {
        console.error('Visitor tracking error:', err);
      }
    };
    
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => trackVisitor());
      } else {
        trackVisitor();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isFirebaseConfigured]);

  // --- Callbacks for state management ---

  // --- Launch Mode Callbacks ---
  const handleSaveLaunchSettings = async (settings: LaunchSettings) => {
    try {
      await saveLaunchSettingsToFirestore(settings);
      setLaunchSettings(settings);
    } catch (error) {
      console.error('Failed to save launch settings:', error);
      throw error;
    }
  };

  const handleCountdownComplete = async () => {
    if (launchSettings.enabled) {
      const updatedSettings = {
        ...launchSettings,
        enabled: false,
        updatedAt: new Date().toISOString()
      };
      try {
        await saveLaunchSettingsToFirestore(updatedSettings);
        setLaunchSettings(updatedSettings);
        toast.success('Launch Countdown Complete! Site is now fully live.');
      } catch (error) {
        console.error('Failed to disable launch mode automatically:', error);
      }
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Sign out error:', err);
    }

    // Clear every locally stored authentication/session data
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.error('Storage clear error:', err);
    }

    // Clear all user/admin React states
    setCurrentUser(null);
    setWishlist([]);
    setSelectedProductId(null);
    setActiveTab('home');

    // Remove route history from /admin to '/'
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }

    toast.success('Logged out successfully.');
  };

  const handleToggleWishlist = async (productId: string) => {
    let updatedWishlist: string[];
    const isAdding = !wishlist.includes(productId);
    
    if (!isAdding) {
      updatedWishlist = wishlist.filter(id => id !== productId);
      toast.info('Removed from wishlist.');
    } else {
      updatedWishlist = [...wishlist, productId];
      toast.success('Added to wishlist!');
    }

    setWishlist(updatedWishlist);
    localStorage.setItem('onbudget_wishlist', JSON.stringify(updatedWishlist));

    if (currentUser) {
      try {
        // Sync with cloud firestore
        await saveWishlistToFirestore(currentUser.uid, updatedWishlist);
      } catch (err: any) {
        console.error('Failed to sync wishlist with cloud:', err);
        toast.error('Could not sync wishlist to your account.');
      }
    }
  };

  const handleOpenProduct = async (productIdOrSlug: string) => {
    const targetProduct = findProductByIdentifier(productIdOrSlug, products);

    const actualId = targetProduct ? targetProduct.id : productIdOrSlug;
    const actualSlug = targetProduct ? getProductSlug(targetProduct) : productIdOrSlug;

    setSelectedProductId(actualSlug);
    setActiveTab('home');

    const targetPath = `/product/${actualSlug}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    // Add to recently viewed list (max 5)
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== actualId);
      return [actualId, ...filtered].slice(0, 5);
    });

    // Record click metrics in analytics
    if (targetProduct && isFirebaseConfigured) {
      try {
        await trackClickInFirestore('view', actualId, undefined, targetProduct.category, targetProduct.title);
        const updatedAnalytics = await fetchAnalyticsFromFirestore();
        if (updatedAnalytics) {
          setAnalytics(updatedAnalytics);
        }
      } catch (err) {
        console.error('Failed to track product view in Firestore:', err);
      }
    }
  };

  const handleTrackAffiliateClick = async (productId: string, platform: string) => {
    const targetProduct = products.find(p => p.id === productId);
    if (isFirebaseConfigured) {
      try {
        await trackClickInFirestore('affiliate', productId, platform, targetProduct?.category, targetProduct?.title);
        const updatedAnalytics = await fetchAnalyticsFromFirestore();
        if (updatedAnalytics) {
          setAnalytics(updatedAnalytics);
        }
      } catch (err) {
        console.error('Failed to track affiliate click in Firestore:', err);
      }
    }
  };

  // --- CRUD callbacks for ADMIN PANEL with firestore sync ---

  const handleAddProduct = async (product: Product) => {
    setProducts(prev => [product, ...prev]);
    await addProductToFirestore(product);
  };

  const handleUpdateProduct = async (product: Product) => {
    setProducts(prev => prev.map(p => (p.id === product.id ? product : p)));
    await updateProductInFirestore(product);
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    await deleteProductFromFirestore(productId);
  };

  const handleAddCategory = async (category: Category) => {
    setCategories(prev => [...prev, category]);
    await addCategoryToFirestore(category);
  };

  const handleUpdateCategory = async (category: Category) => {
    setCategories(prev => prev.map(c => (c.id === category.id ? category : c)));
    await updateCategoryInFirestore(category);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    await deleteCategoryFromFirestore(categoryId);
  };

  const handleAddReel = async (reel: Reel) => {
    setReels(prev => [reel, ...prev]);
    await addReelToFirestore(reel);
  };

  const handleUpdateReel = async (reel: Reel) => {
    setReels(prev => prev.map(r => (r.id === reel.id ? reel : r)));
    await updateReelInFirestore(reel);
  };

  const handleDeleteReel = async (reelId: string) => {
    setReels(prev => prev.filter(r => r.id !== reelId));
    await deleteReelFromFirestore(reelId);
  };

  const handleAddPromotionalBanner = async (banner: PromotionalBanner) => {
    try {
      await addPromotionalBannerToFirestore(banner);
      setPromotionalBanners(prev => {
        const exists = prev.some(b => b.id === banner.id);
        if (exists) return prev.map(b => (b.id === banner.id ? banner : b));
        return [...prev, banner];
      });
      // Refresh list from Firestore to guarantee state matches persisted database records
      const freshBanners = await fetchPromotionalBannersFromFirestore();
      if (freshBanners && freshBanners.length > 0) {
        setPromotionalBanners(freshBanners);
      }
      toast.success('Promotional banner saved successfully!');
    } catch (err: any) {
      console.error('Failed to add promotional banner:', err);
      toast.error('Failed to save promotional banner: ' + (err?.message || 'Database write error'));
      throw err;
    }
  };

  const handleUpdatePromotionalBanner = async (banner: PromotionalBanner) => {
    try {
      await updatePromotionalBannerInFirestore(banner);
      setPromotionalBanners(prev => prev.map(b => (b.id === banner.id ? banner : b)));
      const freshBanners = await fetchPromotionalBannersFromFirestore();
      if (freshBanners && freshBanners.length > 0) {
        setPromotionalBanners(freshBanners);
      }
      toast.success('Promotional banner updated successfully!');
    } catch (err: any) {
      console.error('Failed to update promotional banner:', err);
      toast.error('Failed to update promotional banner: ' + (err?.message || 'Database write error'));
      throw err;
    }
  };

  const handleDeletePromotionalBanner = async (bannerId: string) => {
    try {
      await deletePromotionalBannerFromFirestore(bannerId);
      setPromotionalBanners(prev => prev.filter(b => b.id !== bannerId));
      const freshBanners = await fetchPromotionalBannersFromFirestore();
      if (freshBanners) {
        setPromotionalBanners(freshBanners);
      }
      toast.success('Promotional banner deleted!');
    } catch (err: any) {
      console.error('Failed to delete promotional banner:', err);
      toast.error('Failed to delete promotional banner: ' + (err?.message || 'Database operation error'));
      throw err;
    }
  };

  const handleReorderPromotionalBanners = async (banners: PromotionalBanner[]) => {
    try {
      const updated = banners.map((b, idx) => ({ ...b, displayOrder: idx + 1 }));
      setPromotionalBanners(updated);
      await reorderPromotionalBannersInFirestore(updated);
    } catch (err: any) {
      console.error('Failed to reorder promotional banners:', err);
      toast.error('Failed to reorder promotional banners');
    }
  };

  const handleAddRetailer = async (newRetailer: Retailer) => {
    try {
      setRetailers(prev => {
        const updated = [...prev.filter(r => r.id !== newRetailer.id), newRetailer];
        registerMasterRetailers(updated);
        return updated;
      });
      await addRetailerToFirestore(newRetailer);
      toast.success(`${newRetailer.name} retailer saved successfully!`);
    } catch (err: any) {
      console.error('Failed to save retailer:', err);
      toast.error('Failed to save retailer: ' + (err?.message || 'Database error'));
    }
  };

  const handleUpdateRetailer = async (updatedRetailer: Retailer) => {
    try {
      setRetailers(prev => {
        const updated = prev.map(r => r.id === updatedRetailer.id ? updatedRetailer : r);
        registerMasterRetailers(updated);
        return updated;
      });
      await updateRetailerInFirestore(updatedRetailer);
      toast.success(`${updatedRetailer.name} retailer updated successfully!`);
    } catch (err: any) {
      console.error('Failed to update retailer:', err);
      toast.error('Failed to update retailer: ' + (err?.message || 'Database error'));
    }
  };

  const handleDeleteRetailer = async (retailerId: string) => {
    try {
      const retailerToDelete = retailers.find(r => r.id === retailerId);
      setRetailers(prev => {
        const updated = prev.filter(r => r.id !== retailerId);
        registerMasterRetailers(updated);
        return updated;
      });
      await deleteRetailerFromFirestore(retailerId);
      toast.success(`${retailerToDelete?.name || 'Retailer'} deleted successfully!`);
    } catch (err: any) {
      console.error('Failed to delete retailer:', err);
      toast.error('Failed to delete retailer: ' + (err?.message || 'Database error'));
    }
  };

  const handleMarkNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await markNotificationsAsReadInFirestore(notifications.map(n => n.id));
  };

  // --- Voice dictation search tool ---
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceActive(true);
      setTimeout(() => {
        setSearchQuery('LED light');
        setVoiceActive(false);
      }, 1500);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setVoiceActive(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setSearchQuery(speechToText);
      setVoiceActive(false);
    };

    recognition.onerror = () => {
      setVoiceActive(false);
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewsletterSubmitting) return;

    const trimmed = newsletterEmail.trim();
    if (!trimmed) {
      toast.error('Please enter a valid email address.');
      setNewsletterErrorMessage('Please enter a valid email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error('Please enter a valid email address.');
      setNewsletterErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsNewsletterSubmitting(true);
    setNewsletterErrorMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'website_footer' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('onbudget_newsletter_active', 'true');
        setNewsletterSubscribed(true);
        setNewsletterSuccess(true);
        setNewsletterEmail('');
        toast.success(data.message || "You're subscribed! Check your inbox for a confirmation email.");
      } else {
        const errorMsg = data.message || 'Failed to subscribe. Please try again.';
        setNewsletterErrorMessage(errorMsg);
        if (data.isDuplicate) {
          toast.info(errorMsg);
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (err) {
      console.error('Newsletter submission error:', err);
      const networkMsg = 'Network error. Please check your connection and try again.';
      setNewsletterErrorMessage(networkMsg);
      toast.error(networkMsg);
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  // --- Smart Filter & Search Logic ---
  const [filterState, setFilterState] = useState<SmartFilterState>({
    category: '',
    brand: '',
    marketplace: '',
    priceRange: null,
    minDiscount: 0,
    minRating: 0,
    badge: 'all'
  });

  // Keep filterState category and price in sync when changed from Hero or Navbar
  useEffect(() => {
    if (selectedCategory !== filterState.category) {
      setFilterState(prev => ({ ...prev, category: selectedCategory }));
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedPriceRange !== filterState.priceRange) {
      setFilterState(prev => ({ ...prev, priceRange: selectedPriceRange }));
    }
  }, [selectedPriceRange]);

  const filteredProducts = React.useMemo(() => {
    // Step 1: Smart Search Fuzzy Matching, Spell Correction, and Tag Matching
    let matched = smartSearchProducts(products, searchQuery).results;

    // Step 2: Category Filter
    const cat = filterState.category || selectedCategory;
    if (cat && cat !== '' && cat !== 'all-categories' && cat.toLowerCase() !== 'all categories') {
      const catLower = cat.toLowerCase();
      matched = matched.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        if (pCat === catLower) return true;

        if (catLower === 'mobiles-accessories' || catLower === 'mobiles & accessories') {
          return pCat.includes('mobile') || pCat.includes('smartphone') || pCat === 'mobile-accessories';
        }
        if (catLower === 'electronics') {
          return pCat.includes('tech') || pCat.includes('electronic') || pCat === 'tech';
        }
        if (catLower === 'computers-accessories' || catLower === 'computers & accessories') {
          return pCat.includes('laptop') || pCat.includes('desk') || pCat.includes('computer') || pCat === 'desk-setup' || pCat === 'laptop-accessories';
        }
        if (catLower === 'tv-audio-video' || catLower === 'tv, audio & video') {
          return pCat.includes('audio') || pCat.includes('video') || pCat.includes('tv');
        }
        if (catLower === 'home-kitchen' || catLower === 'home & kitchen') {
          return pCat.includes('kitchen') || pCat.includes('home');
        }
        if (catLower === 'home-decor' || catLower === 'home decor') {
          return pCat.includes('home') || pCat.includes('decor');
        }
        if (catLower === 'toys-games' || catLower === 'toys & games') {
          return pCat.includes('game') || pCat.includes('toy') || pCat === 'gaming';
        }

        return pCat.includes(catLower) || catLower.includes(pCat);
      });
    }

    // Step 3: Brand Filter
    if (filterState.brand) {
      matched = matched.filter(p => p.brand && p.brand.toLowerCase() === filterState.brand.toLowerCase());
    }

    // Step 4: Marketplace Filter
    if (filterState.marketplace) {
      const mp = filterState.marketplace.toLowerCase();
      matched = matched.filter(p => {
        const activeOffers = getNormalizedRetailerOffers(p, false);
        if (activeOffers.length > 0) {
          return activeOffers.some(o => o.retailerName.toLowerCase().includes(mp));
        }
        return (
          (p.affiliateLinks && p.affiliateLinks.some(l => l.platform.toLowerCase().includes(mp))) ||
          (p.purchaseLinks && p.purchaseLinks.some(l => l.name.toLowerCase().includes(mp)))
        );
      });
    }

    // Step 5: Price Range (based on Best Price)
    const maxPrice = filterState.priceRange !== null ? filterState.priceRange : selectedPriceRange;
    if (maxPrice !== null) {
      matched = matched.filter(p => getProductBestPrice(p).bestPrice <= maxPrice);
    }

    // Step 6: Min Discount
    if (filterState.minDiscount > 0) {
      matched = matched.filter(p => getProductBestPrice(p).discountPercent >= filterState.minDiscount);
    }

    // Step 7: Min Rating
    if (filterState.minRating > 0) {
      matched = matched.filter(p => p.rating >= filterState.minRating);
    }

    // Step 8: Badges
    const badge = filterState.badge || badgeFilter;
    if (badge === 'tested') matched = matched.filter(p => p.badges.personallyTested);
    if (badge === 'recommended') matched = matched.filter(p => p.badges.recommended);
    if (badge === 'trending') matched = matched.filter(p => p.badges.trending);
    if (badge === 'reel') matched = matched.filter(p => p.badges.seenInReel);

    // Step 9: Sorting
    return matched.sort((a, b) => {
      const s = sortOption as string;
      if (s === 'popular') return b.rating - a.rating;
      if (s === 'latest' || s === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (s === 'low-price') return getProductBestPrice(a).bestPrice - getProductBestPrice(b).bestPrice;
      if (s === 'high-price') return getProductBestPrice(b).bestPrice - getProductBestPrice(a).bestPrice;
      if (s === 'discount') return getProductBestPrice(b).discountPercent - getProductBestPrice(a).discountPercent;
      if (s === 'rating') return b.rating - a.rating;
      if (s === 'trending') return (b.badges.trending ? 1 : 0) - (a.badges.trending ? 1 : 0);
      return 0;
    });
  }, [products, searchQuery, filterState, selectedCategory, selectedPriceRange, badgeFilter, sortOption]);

  // Hot Trend Curated rows
  const todayPicks = products.filter(p => p.badges.recommended).slice(0, 4);

  // Translation Dictionaries (English / Hindi)
  const dict = {
    en: {
      heroTitle: "Curated Gadgets.",
      heroSubtitle: "Personally Tested.",
      heroHighlight: "Strictly On Budget.",
      trendingSearches: "Trending Searches:",
      picksTitle: "Today's Top Curation Picks",
      picksSub: "Hand-picked viral gadgets with verified unboxings.",
      catalogTitle: "Tested Budget Catalog",
      catalogSub: "Strictly reviewed electronics, desk accents, and study materials.",
      emptyCatalog: "No matching budget curations found. Try clearing filters!",
      joinCom: "Join Our Budget Community",
      joinComSub: "Get notified when new tested products go live or coupons drop.",
      newsPlaceholder: "Enter your email for deals",
      newsButton: "Subscribe",
      channels: "Community Broadcast Channels",
      tgTitle: "Instagram Community Channel",
      tgSub: "Get real-time flash deal alerts under ₹199",
      waTitle: "WhatsApp Channel",
      waSub: "Get daily product reviews and unboxings directly in chat",
      footerTxt: "© 2026 In Our Budget. All rights reserved. Personally tested products curated for students and setup enthusiasts.",
    },
    hi: {
      heroTitle: "क्यूरेटेड गैजेट्स।",
      heroSubtitle: "स्वयं जाँचे गए।",
      heroHighlight: "पूरी तरह बजट में।",
      trendingSearches: "ट्रेंडिंग सर्च:",
      picksTitle: "आज के टॉप क्यूरेटेड पिक्स",
      picksSub: "सत्यापित अनबॉक्सिंग के साथ हाथ से चुने गए वायरल गैजेट।",
      catalogTitle: "परीक्षित बजट सूची",
      catalogSub: "समीक्षा किए गए इलेक्ट्रॉनिक्स, डेस्क एक्सेसरीज और अध्ययन सामग्री।",
      emptyCatalog: "कोई बजट उत्पाद नहीं मिला। फ़िल्टर साफ़ करके देखें!",
      joinCom: "हमारे बजट समुदाय से जुड़ें",
      joinComSub: "जब नए उत्पादों की समीक्षा लाइव हो या कूपन जारी हों, तो तुरंत अलर्ट प्राप्त करें।",
      newsPlaceholder: "सौदों के लिए ईमेल दर्ज करें",
      newsButton: "सदस्य बनें",
      channels: "सामुदायिक प्रसारण चैनल",
      tgTitle: "इंस्टाग्राम कम्युनिटी चैनल",
      tgSub: "₹199 से कम के त्वरित सौदे प्राप्त करें",
      waTitle: "व्हाट्सएप चैनल",
      waSub: "सीधे चैट में दैनिक उत्पाद समीक्षा और अनबॉक्सिंग प्राप्त करें",
      footerTxt: "© 2026 इन आवर बजट। सर्वाधिकार सुरक्षित। छात्रों और होम सेटअप प्रेमियों के लिए क्यूरेट किया गया।",
    }
  };

  const t = dict[language];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between selection:bg-[#FF5A00]/25 selection:text-[#FF5A00] transition-colors duration-300">
      
      {/* Voice Active Ripple Panel Overlay */}
      <AnimatePresence>
        {voiceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="w-20 h-20 bg-[#FF5A00]/10 border border-[#FF5A00]/20 text-[#FF5A00] rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-[#FF5A00]/15 rounded-full animate-ping" />
              <Search className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">Listening for search terms...</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">Speak naturally. Say things like &quot;under 200&quot; or &quot;desk organizer&quot;.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location / Auto Currency Suggestion Banner for International Visitors */}
      <LocationCurrencyBanner
        currentCurrency={currentCurrency}
        onCurrencyChange={(code) => {
          setCurrentCurrency(code);
        }}
      />

      {/* STICKY HEADER NAVIGATION SYSTEM (Flipkart-Style) */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
        {/* Navigation Bar with authenticated user prop */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => handleNavigate(tab)}
          categories={categories}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onVoiceSearch={handleVoiceSearch}
          user={currentUser}
          currentCurrency={currentCurrency}
          onCurrencyChange={(code) => {
            setCurrentCurrency(code);
          }}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          products={products}
          onSelectProduct={(productId) => {
            setSelectedProductId(productId);
            handleNavigate('home');
          }}
          authModalOpenRequested={authModalOpenRequested}
          onAuthModalClosed={() => setAuthModalOpenRequested(false)}
          onLogoutRequest={() => setShowLogoutConfirm(true)}
        />

        {/* Flipkart-Style E-Commerce Category Navigation */}
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            handleNavigate('home');
          }}
        />
      </header>

      <div className="space-y-6">

        {/* MAIN BODY WRAPPER */}
        {dbLoading ? (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
            <div className="space-y-6">
              <CategoryBarSkeleton />
              <ProductGridSkeleton count={8} />
            </div>
          </main>
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* DETAIL VIEW ROUTING */}
            {selectedProductId ? (() => {
              const matchedProduct = findProductByIdentifier(selectedProductId, products);

              if (isDetailLoading) {
                return <ProductDetailsSkeleton />;
              }

              if (matchedProduct) {
                return (
                  <React.Suspense fallback={<ProductDetailsSkeleton />}>
                    <ProductDetail
                      product={matchedProduct}
                      reels={reels}
                      onBack={() => {
                        setSelectedProductId(null);
                        if (extractProductSlugFromPath(window.location.pathname)) {
                          window.history.pushState({}, '', '/');
                        }
                      }}
                      isWishlisted={wishlist.includes(matchedProduct.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onOpenProduct={handleOpenProduct}
                      allProducts={products}
                      onTrackAffiliateClick={handleTrackAffiliateClick}
                      wishlist={wishlist}
                      recentlyViewedIds={recentlyViewed}
                    />
                  </React.Suspense>
                );
              }

              if (dbLoading) {
                return <ProductDetailsSkeleton />;
              }

              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-[#FF5A00]/10 text-[#FF5A00] rounded-2xl flex items-center justify-center mx-auto">
                    <Package className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
                    Product Not Found
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This product may have been removed, unlisted, or the link is invalid. Explore our curated budget collection!
                  </p>
                  <button
                    onClick={() => {
                      setSelectedProductId(null);
                      window.history.pushState({}, '', '/');
                    }}
                    className="px-6 py-2.5 bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 font-display"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Products
                  </button>
                </div>
              );
            })() : (
              // STANDARD TAB RENDERING
              <div className="space-y-12">
                
                {/* TAB 1: EXPLORE CATALOG */}
                {activeTab === 'home' && (
                  <div className="space-y-10">
                    {/* Promotional Banner Carousel (placed below Category Navigation and above Browse by Price Bracket) */}
                    <PromotionalCarousel
                      banners={promotionalBanners}
                      onSelectCategory={(catId) => {
                        setSelectedCategory(catId);
                        setSelectedPriceRange(null);
                        handleNavigate('home');
                      }}
                      onOpenProduct={(prodId) => handleOpenProduct(prodId)}
                    />

                    {/* Hero Banner (Browse by Price Bracket) */}
                    <Hero
                      categories={categories}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      selectedPriceRange={selectedPriceRange}
                      setSelectedPriceRange={setSelectedPriceRange}
                      totalProducts={products.length}
                      currentCurrency={currentCurrency}
                    />

                    {/* TODAY'S TOP PICKS SECTION */}
                    {searchQuery === '' && selectedCategory === '' && selectedPriceRange === null && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2 font-display">
                              <Flame className="w-5 h-5 text-[#FF5A00] animate-pulse" />
                              {t.picksTitle}
                            </h2>
                            <p className="text-xs text-slate-400">{t.picksSub}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {todayPicks.map((p, idx) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              priority={idx < 2}
                              onOpenProduct={handleOpenProduct}
                              isWishlisted={wishlist.includes(p.id)}
                              onToggleWishlist={handleToggleWishlist}
                              onOpenSocialLinks={setSocialModalProduct}
                              currentCurrency={currentCurrency}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MAIN CATALOG WITH SMART FILTERS */}
                    <div className="space-y-6">
                      <SmartSearchFilters
                        products={products}
                        categories={categories}
                        filterState={filterState}
                        setFilterState={setFilterState}
                        sortOption={sortOption as SortOption}
                        setSortOption={setSortOption as (sort: SortOption) => void}
                        totalFilteredCount={filteredProducts.length}
                        onClearAll={() => {
                          setFilterState({
                            category: '',
                            brand: '',
                            marketplace: '',
                            priceRange: null,
                            minDiscount: 0,
                            minRating: 0,
                            badge: 'all'
                          });
                          setSelectedCategory('');
                          setSelectedPriceRange(null);
                        }}
                      />

                      {/* Catalog Grid */}
                      {isFilterLoading ? (
                        <ProductGridSkeleton count={8} />
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl max-w-md mx-auto shadow-sm">
                          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{t.emptyCatalog}</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredProducts.slice(0, visibleCatalogCount).map((p, idx) => (
                              <ProductCard
                                key={p.id}
                                product={p}
                                priority={idx < 4}
                                onOpenProduct={handleOpenProduct}
                                isWishlisted={wishlist.includes(p.id)}
                                onToggleWishlist={handleToggleWishlist}
                                onOpenSocialLinks={setSocialModalProduct}
                                currentCurrency={currentCurrency}
                              />
                            ))}
                          </div>

                          {filteredProducts.length > visibleCatalogCount && (
                            <div className="text-center pt-2">
                              <button
                                onClick={() => setVisibleCatalogCount(prev => prev + 12)}
                                className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer inline-flex items-center gap-2"
                              >
                                Load More Curations ({filteredProducts.length - visibleCatalogCount} remaining)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI RECOMMENDATION ENGINE SECTIONS */}
                    {searchQuery === '' && selectedCategory === '' && selectedPriceRange === null && (
                      <React.Suspense fallback={<ProductGridSkeleton count={4} />}>
                        <HomeRecommendationSections
                          products={products}
                          reels={reels}
                          wishlist={wishlist}
                          recentlyViewedIds={recentlyViewed}
                          onOpenProduct={handleOpenProduct}
                          onToggleWishlist={handleToggleWishlist}
                          onOpenSocialLinks={setSocialModalProduct}
                          currentCurrency={currentCurrency}
                        />
                      </React.Suspense>
                    )}
                  </div>
                )}

                {/* TAB 3: WISHLIST / COLLECTIONS */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-display">Your Saved Curations</h2>
                      <p className="text-xs text-slate-400">Fast access to products you are planning to purchase.</p>
                    </div>

                    {isTabLoading ? (
                      <WishlistSkeleton count={4} />
                    ) : wishlist.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl max-w-sm mx-auto shadow-sm">
                        <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Your Wishlist is empty.</p>
                        <button
                          onClick={() => handleNavigate('home')}
                          className="mt-4 bg-[#FF5A00] hover:bg-[#E04F00] text-white text-[11px] font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs"
                        >
                          Explore Curated Catalog
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products
                          .filter(p => wishlist.includes(p.id))
                          .map(p => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              onOpenProduct={handleOpenProduct}
                              isWishlisted={true}
                              onToggleWishlist={handleToggleWishlist}
                              onOpenSocialLinks={setSocialModalProduct}
                              currentCurrency={currentCurrency}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PROFILE */}
                {activeTab === 'profile' && (
                  <div className="max-w-2xl mx-auto space-y-8">
                    {/* Card profile */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
                      {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="User Avatar" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-[#FF5A00]/10 border border-[#FF5A00]/20 text-[#FF5A00] rounded-full flex items-center justify-center font-black text-2xl font-display">
                          {currentUser?.displayName ? currentUser.displayName.slice(0, 1) : 'U'}
                        </div>
                      )}
                      <div className="text-center sm:text-left space-y-1">
                        <h2 className="text-base font-bold text-slate-950 dark:text-white font-display">
                          {currentUser?.displayName || 'Budget Explorer'}
                        </h2>
                        <p className="text-xs text-slate-400">{currentUser?.email || 'Logged Out Guest'}</p>
                        <span className="inline-flex items-center gap-1.5 text-[10px] bg-[#FF5A00]/10 text-[#FF5A00] font-bold px-2 py-0.5 rounded-full uppercase border border-[#FF5A00]/15">
                          <Award className="w-3 h-3" /> Premium Saver Level 3
                        </span>
                      </div>
                    </div>

                    {/* Settings & Preferences */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs">
                      <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2.5 font-display">Platform Settings</h3>
                      
                      <div className="space-y-4 text-xs">
                        {/* Language Selection */}
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">Language / भाषा</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Translate static interface text</p>
                          </div>
                          <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-1 rounded-xl">
                            <button
                              onClick={() => setLanguage('en')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                language === 'en' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              English
                            </button>
                            <button
                              onClick={() => setLanguage('hi')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                language === 'hi' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              हिन्दी
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recently Viewed */}
                    {recentlyViewed.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-display text-left">Recently Viewed Items</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {products
                            .filter(p => recentlyViewed.includes(p.id))
                            .map(p => (
                              <div
                                key={p.id}
                                onClick={() => handleOpenProduct(p.id)}
                                className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-[#FF5A00]/40 rounded-2xl cursor-pointer flex gap-3 group transition-all shadow-2xs text-left"
                              >
                                <img
                                  src={p.images[0]}
                                  alt={p.title}
                                  className="w-10 h-10 object-cover rounded-xl"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-[#FF5A00] transition-colors truncate font-display">
                                    {p.title}
                                  </h4>
                                  <span className="text-[11px] font-bold text-[#FF5A00] block mt-0.5">₹{p.price}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Logout Button (At bottom of profile page) */}
                    <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800 flex flex-col items-center gap-3">
                      {currentUser ? (
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(true)}
                          className="w-full sm:w-auto px-8 py-3.5 border-2 border-red-500/40 hover:border-red-500 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white dark:border-red-500/40 dark:bg-red-950/20 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-sm shadow-red-500/10 font-display"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAuthModalOpenRequested(true)}
                          className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5A00] hover:bg-[#E04F00] text-white font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-md shadow-[#FF5A00]/20 font-display"
                        >
                          <User className="w-4 h-4" />
                          Sign In
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: ADMIN HQ PANEL with real-time firestore updates */}
                {activeTab === 'admin' && isAdmin && (
                  <React.Suspense fallback={<AdminFormSkeleton />}>
                    <AdminPanel
                      products={products}
                      categories={categories}
                      reels={reels}
                      promotionalBanners={promotionalBanners}
                      retailers={retailers}
                      analytics={analytics}
                      isLoading={isTabLoading}
                      onAddProduct={handleAddProduct}
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onAddCategory={handleAddCategory}
                      onUpdateCategory={handleUpdateCategory}
                      onDeleteCategory={handleDeleteCategory}
                      onAddReel={handleAddReel}
                      onUpdateReel={handleUpdateReel}
                      onDeleteReel={handleDeleteReel}
                      onAddPromotionalBanner={handleAddPromotionalBanner}
                      onUpdatePromotionalBanner={handleUpdatePromotionalBanner}
                      onDeletePromotionalBanner={handleDeletePromotionalBanner}
                      onReorderPromotionalBanners={handleReorderPromotionalBanners}
                      onAddRetailer={handleAddRetailer}
                      onUpdateRetailer={handleUpdateRetailer}
                      onDeleteRetailer={handleDeleteRetailer}
                      launchSettings={launchSettings}
                      onSaveLaunchSettings={handleSaveLaunchSettings}
                    />
                  </React.Suspense>
                )}

              </div>
            )}

          </main>
        )}
      </div>

      {/* FOOTER & NEWSLETTER */}
      {!selectedProductId && (
        <footer className="mt-20 border-t border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 pt-16 pb-8 space-y-12 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            
            {/* Column 1: Newsletter */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white font-display">{t.joinCom}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{t.joinComSub}</p>

              {newsletterSubscribed ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>You're subscribed! Check your inbox for a confirmation email.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <label htmlFor="newsletter-email-input" className="sr-only">
                      Enter your email address to subscribe for daily budget deals
                    </label>
                    <input
                      id="newsletter-email-input"
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={e => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterErrorMessage) setNewsletterErrorMessage('');
                      }}
                      disabled={isNewsletterSubmitting}
                      placeholder={t.newsPlaceholder}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] dark:focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none placeholder-slate-500 dark:placeholder-slate-400 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={isNewsletterSubmitting}
                      className="bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center min-w-[90px]"
                    >
                      {isNewsletterSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        t.newsButton
                      )}
                    </button>
                  </div>
                  {newsletterErrorMessage && (
                    <p className="text-[11px] text-rose-500 font-medium pl-1">{newsletterErrorMessage}</p>
                  )}
                </form>
              )}
            </div>

            {/* Column 2: Social Channels */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white font-display">{t.channels}</h3>
              <div className="space-y-3 text-xs">
                <a
                  href="https://www.instagram.com/channel/AbY6a8SO0q8Jx1aV/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-850/60 border border-slate-200/50 dark:border-slate-850 rounded-2xl transition-all group shadow-3xs"
                >
                  <div className="w-8 h-8 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white group-hover:text-[#FF5A00] transition-colors font-display">{t.tgTitle}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.tgSub}</p>
                  </div>
                </a>

                <a
                  href="https://whatsapp.com/channel/0029Vb8SOImD8SDvTKYTcr15"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-850/60 border border-slate-200/50 dark:border-slate-850 rounded-2xl transition-all group shadow-3xs"
                >
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white group-hover:text-[#FF5A00] transition-colors font-display">{t.waTitle}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.waSub}</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Column 3: Sitemaps */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider font-display">Browse Quick Links</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button onClick={() => { handleNavigate('home'); setSelectedCategory('desk-setup'); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Desk Setups</button>
                <button onClick={() => { handleNavigate('home'); setSelectedCategory('gaming'); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Gaming Gear</button>
                <button onClick={() => { handleNavigate('home'); setSelectedCategory('tech'); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Tech & Gadgets</button>
                <button onClick={() => { handleNavigate('home'); setSelectedPriceRange(99); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Best under ₹99</button>
                <button onClick={() => { handleNavigate('home'); setSelectedPriceRange(199); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Best under ₹199</button>
                <button onClick={() => { handleNavigate('home'); setSelectedPriceRange(499); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Best under ₹499</button>
              </div>
            </div>

          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800 pt-8 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-md mx-auto font-sans">
              {t.footerTxt}
            </p>
          </div>
        </footer>
      )}

      {/* 403 Access Denied Modal */}
      <AnimatePresence>
        {showAccessDenied && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                setShowAccessDenied(false);
                handleNavigate('home');
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden z-10 text-center space-y-6"
            >
              <div className="inline-flex w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-2xl items-center justify-center text-red-500 mb-2 border border-red-100 dark:border-red-900/20">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white font-display">
                  403 - Admin Access Denied
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your account does not have administrative privileges. If you are the owner, please sign in with your authorized admin email.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowAccessDenied(false);
                  handleNavigate('home');
                }}
                className="w-full bg-[#FF5A00] hover:bg-[#E04F00] text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5A00]/10 cursor-pointer transition-colors"
              >
                Return to Explore
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setShowLogoutConfirm(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 text-center space-y-5"
            >
              <div className="inline-flex w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-2xl items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30 shadow-2xs">
                <LogOut className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white font-display">
                  Logout?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to sign out of your account?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer font-display"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-red-500/20 font-display"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Launch Mode Landing Overlay */}
      <AnimatePresence>
        {launchSettings.enabled && !isAdmin && (
          <React.Suspense fallback={null}>
            <LaunchModeOverlay
              settings={launchSettings}
              onCountdownComplete={handleCountdownComplete}
              isAdmin={isAdmin}
            />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* Social Links Modal Popup */}
      <React.Suspense fallback={null}>
        <SocialLinksModal
          isOpen={!!socialModalProduct}
          onClose={() => setSocialModalProduct(null)}
          product={socialModalProduct}
        />
      </React.Suspense>

      {/* Floating Scroll to Top button */}
      <ScrollToTop />

      {/* PWA Install & Update Manager */}
      <PWAInstallPrompt />

    </div>
  );
}
