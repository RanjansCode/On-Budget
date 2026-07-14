import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Search, MessageSquare, Heart, Bell, User, Layout, ArrowRight,
  Star, Laptop, Cpu, BookOpen, AlertCircle, Clock,
  Package, Check, Copy, Flame, ShieldAlert, Play, Send, ChevronRight,
  SlidersHorizontal, CheckCircle2, Award, Zap, RefreshCw
} from 'lucide-react';

import {
  Product, Category, Reel, AnalyticsData, NotificationItem, ADMIN_EMAILS
} from './types';

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
  fetchWishlistFromFirestore,
  saveWishlistToFirestore,
  fetchNotificationsFromFirestore,
  markNotificationsAsReadInFirestore,
  subscribeNewsletterInFirestore,
  User as FirebaseUser
} from './lib/firebase';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import AdminPanel from './components/AdminPanel';
import OnBudgetAI from './components/OnBudgetAI';
import { useToast } from './components/Toast';

export default function App() {
  const toast = useToast();

  // --- Firebase User Auth State ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(true);

  // --- Core Cloud Synchronized States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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

  // Analytics state (synchronized fallback)
  const [analytics, setAnalytics] = useState<AnalyticsData>(() => {
    const local = localStorage.getItem('onbudget_analytics');
    if (local) return JSON.parse(local);

    return {
      totalVisitors: 840,
      pageViews: 1940,
      averageTime: 140,
      bounceRate: 38,
      devices: [
        { device: 'Mobile', count: 520 },
        { device: 'Desktop', count: 280 },
        { device: 'Tablet', count: 40 }
      ],
      countries: [
        { country: 'India', count: 740 },
        { country: 'US', count: 60 },
        { country: 'UK', count: 40 }
      ],
      affiliateClicks: [
        { platform: 'Amazon', clicks: 124 },
        { platform: 'Meesho', clicks: 42 },
        { platform: 'Flipkart', clicks: 28 },
        { platform: 'Croma', clicks: 12 },
        { platform: 'Myntra', clicks: 10 }
      ],
      topCategories: [
        { category: 'desk-setup', clicks: 84 },
        { category: 'tech', clicks: 64 },
        { category: 'gaming', clicks: 52 }
      ],
      topProducts: [
        { productId: 'prod-1', title: 'Minimalist Magnetic Cable Organizer', clicks: 45 },
        { productId: 'prod-7', title: 'Sunset Projection Lamp', clicks: 38 },
        { productId: 'prod-8', title: 'Astronaut Galaxy Star Projector', clicks: 35 }
      ],
      clicksHistory: [
        { date: '07-08', clicks: 120 },
        { date: '07-09', clicks: 155 },
        { date: '07-10', clicks: 140 },
        { date: '07-11', clicks: 195 },
        { date: '07-12', clicks: 165 },
        { date: '07-13', clicks: 210 },
        { date: '07-14', clicks: 190 }
      ]
    };
  });

  // --- Active Session Navigation States ---
  const [activeTab, setActiveTab] = useState<'home' | 'wishlist' | 'profile' | 'admin'>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // --- Filter / Sorting States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'tested' | 'recommended' | 'trending'>('all');
  const [sortOption, setSortOption] = useState<'popular' | 'latest' | 'low-price' | 'discount' | 'rating'>('popular');

  // --- Aesthetic Preference States (Light mode by default!) ---
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('onbudget_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return false; // Default to Light Mode
  });
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // --- Voice Search status ---
  const [voiceActive, setVoiceActive] = useState(false);

  const isAdmin = !!(currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email));

  // 1. Database Initialization and Seeding on boot
  useEffect(() => {
    async function initAndFetch() {
      try {
        setDbLoading(true);
        // Seed initial collections if empty
        await seedDatabaseIfEmpty();

        // Load all data sets in parallel from cloud
        const [cloudProducts, cloudCategories, cloudReels, cloudNotifs] = await Promise.all([
          fetchProductsFromFirestore(),
          fetchCategoriesFromFirestore(),
          fetchReelsFromFirestore(),
          fetchNotificationsFromFirestore()
        ]);

        if (cloudProducts.length > 0) setProducts(cloudProducts);
        if (cloudCategories.length > 0) setCategories(cloudCategories);
        if (cloudReels.length > 0) setReels(cloudReels);
        if (cloudNotifs.length > 0) setNotifications(cloudNotifs);

      } catch (err) {
        console.error("Failed to load Cloud Firestore database collections:", err);
      } finally {
        setDbLoading(false);
      }
    }
    initAndFetch();
  }, []);

  // 2. Real-time Firebase Authentication tracking & Wishlist Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync wishlist from firestore
        const cloudWish = await fetchWishlistFromFirestore(user.uid);
        if (cloudWish.length > 0) {
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

        // If the logged-in user is admin, fetch all products (including drafts)
        const isUserAdmin = !!(user.email && ADMIN_EMAILS.includes(user.email));
        if (isUserAdmin) {
          try {
            const adminProducts = await fetchProductsFromFirestore(true);
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
          const publicProducts = await fetchProductsFromFirestore(false);
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

  // Handle Dark Mode toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('onbudget_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('onbudget_theme', 'light');
    }
  }, [darkMode]);

  // --- Client-Side Route Protection and Path Detection ---
  useEffect(() => {
    if (authLoading) return;

    const pathname = window.location.pathname;
    const isTryingAdmin = pathname.startsWith('/admin');
    const isAdmin = !!(currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email));

    if (isTryingAdmin) {
      if (!isAdmin) {
        // Not authorized! Redirect to home and trigger access denied screen
        window.history.replaceState({}, '', '/');
        setActiveTab('home');
        setShowAccessDenied(true);
      } else {
        // Authorized admin! Make sure the active tab is set to admin
        setActiveTab('admin');
      }
    } else {
      // If activeTab is admin but we are not admin, reset to home
      if (activeTab === 'admin' && !isAdmin) {
        setActiveTab('home');
      }
    }
  }, [authLoading, currentUser, activeTab]);

  // Sync window.location.pathname with state changes
  useEffect(() => {
    if (authLoading) return;
    const pathname = window.location.pathname;
    const isAdmin = !!(currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email));

    if (activeTab === 'admin') {
      if (isAdmin && pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      } else if (!isAdmin) {
        setActiveTab('home');
        window.history.pushState({}, '', '/');
      }
    } else if (activeTab === 'home') {
      if (pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
  }, [activeTab, currentUser, authLoading]);

  // Handle browser back/forward buttons (Popstate events)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const isAdmin = !!(currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email));

      if (pathname.startsWith('/admin')) {
        if (isAdmin) {
          setActiveTab('admin');
        } else {
          window.history.replaceState({}, '', '/');
          setActiveTab('home');
          setShowAccessDenied(true);
        }
      } else if (pathname === '/') {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // Record safe live visitor stats
  useEffect(() => {
    setAnalytics(prev => ({
      ...prev,
      totalVisitors: prev.totalVisitors + 1,
      pageViews: prev.pageViews + 2
    }));
  }, []);

  // --- Callbacks for state management ---

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

  const handleOpenProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActiveTab('home');

    // Add to recently viewed list (max 5)
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== productId);
      return [productId, ...filtered].slice(0, 5);
    });

    // Record click metrics in analytics
    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct) {
      setAnalytics(prev => {
        const updatedTopProducts = [...prev.topProducts];
        const matchIdx = updatedTopProducts.findIndex(tp => tp.productId === productId);
        if (matchIdx > -1) {
          updatedTopProducts[matchIdx].clicks += 1;
        } else {
          updatedTopProducts.push({ productId, title: targetProduct.title, clicks: 1 });
        }

        const updatedTopCategories = [...prev.topCategories];
        const catIdx = updatedTopCategories.findIndex(tc => tc.category === targetProduct.category);
        if (catIdx > -1) {
          updatedTopCategories[catIdx].clicks += 1;
        } else {
          updatedTopCategories.push({ category: targetProduct.category, clicks: 1 });
        }

        return {
          ...prev,
          pageViews: prev.pageViews + 1,
          topProducts: updatedTopProducts.sort((a, b) => b.clicks - a.clicks),
          topCategories: updatedTopCategories.sort((a, b) => b.clicks - a.clicks),
        };
      });
    }
  };

  const handleTrackAffiliateClick = (productId: string, platform: string) => {
    setAnalytics(prev => {
      const updatedAffiliateClicks = prev.affiliateClicks.map(ac => {
        if (ac.platform === platform) {
          return { ...ac, clicks: ac.clicks + 1 };
        }
        return ac;
      });

      return {
        ...prev,
        affiliateClicks: updatedAffiliateClicks,
      };
    });
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
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) return;

    localStorage.setItem('onbudget_newsletter_active', 'true');
    setNewsletterSubscribed(true);
    setNewsletterSuccess(true);
    
    try {
      // Save to Firestore newsletter collection
      await subscribeNewsletterInFirestore(newsletterEmail);
      toast.success('Subscribed successfully to budget drops!');
    } catch (err) {
      console.error('Failed to subscribe newsletter:', err);
      toast.error('Subscription error. Please try again later.');
    }
    
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  // --- Filter and Sort Core Logic ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    const matchesPrice = selectedPriceRange === null || p.price <= selectedPriceRange;

    let matchesBadge = true;
    if (badgeFilter === 'tested') matchesBadge = p.badges.personallyTested;
    if (badgeFilter === 'recommended') matchesBadge = p.badges.recommended;
    if (badgeFilter === 'trending') matchesBadge = p.badges.trending;

    return matchesSearch && matchesCategory && matchesPrice && matchesBadge;
  }).sort((a, b) => {
    if (sortOption === 'popular') return b.rating - a.rating;
    if (sortOption === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOption === 'low-price') return a.price - b.price;
    if (sortOption === 'discount') return b.discount - a.discount;
    if (sortOption === 'rating') return b.rating - a.rating;
    return 0;
  });

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
      tgTitle: "Telegram Deal Broadcast",
      tgSub: "Get real-time flash deal alerts under ₹199",
      waTitle: "WhatsApp Channel",
      waSub: "Get daily product reviews and unboxings directly in chat",
      footerTxt: "© 2026 On Budget. All rights reserved. Personally tested products curated for students and setup enthusiasts.",
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
      tgTitle: "टेलीग्राम सौदा प्रसारण",
      tgSub: "₹199 से कम के त्वरित सौदे प्राप्त करें",
      waTitle: "व्हाट्सएप चैनल",
      waSub: "सीधे चैट में दैनिक उत्पाद समीक्षा और अनबॉक्सिंग प्राप्त करें",
      footerTxt: "© 2026 ऑन बजट। सर्वाधिकार सुरक्षित। छात्रों और होम सेटअप प्रेमियों के लिए क्यूरेट किया गया।",
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

      <div className="space-y-6">
        {/* Navigation Bar with authenticated user prop */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedProductId(null); // Reset detail screen on navigation
          }}
          categories={categories}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onVoiceSearch={handleVoiceSearch}
          user={currentUser}
        />

        {/* LOADING DATABASE OVERLAY */}
        {dbLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <RefreshCw className="w-8 h-8 text-[#FF5A00] animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display">Synchronizing Budget Catalog...</p>
          </div>
        ) : (
          /* MAIN BODY WRAPPER */
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* DETAIL VIEW ROUTING */}
            {selectedProductId ? (
              <ProductDetail
                product={products.find(p => p.id === selectedProductId)!}
                reels={reels}
                onBack={() => setSelectedProductId(null)}
                isWishlisted={wishlist.includes(selectedProductId)}
                onToggleWishlist={handleToggleWishlist}
                onOpenProduct={handleOpenProduct}
                allProducts={products}
                onTrackAffiliateClick={handleTrackAffiliateClick}
              />
            ) : (
              // STANDARD TAB RENDERING
              <div className="space-y-12">
                
                {/* TAB 1: EXPLORE CATALOG */}
                {activeTab === 'home' && (
                  <div className="space-y-10">
                    {/* Hero Banner */}
                    <Hero
                      categories={categories}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      selectedPriceRange={selectedPriceRange}
                      setSelectedPriceRange={setSelectedPriceRange}
                      totalProducts={products.length}
                    />

                    {/* Trending Search Shortcuts */}
                    <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-2xl shadow-2xs">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-1.5 font-display">{t.trendingSearches}</span>
                      {['Cable Organizer', 'Flashlight', 'RGB Lights', 'Sunset Lamp', 'Galaxy Projector', 'Felt Desk Mat'].map(phrase => (
                        <button
                          key={phrase}
                          onClick={() => setSearchQuery(phrase)}
                          className="text-[11px] bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                        >
                          {phrase}
                        </button>
                      ))}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-[10px] font-bold text-red-500 ml-auto pr-1 hover:underline cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>

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
                          {todayPicks.map(p => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              onOpenProduct={handleOpenProduct}
                              isWishlisted={wishlist.includes(p.id)}
                              onToggleWishlist={handleToggleWishlist}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MAIN CATALOG WITH ADAPTIVE FILTERS */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                          <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-display">{t.catalogTitle}</h2>
                          <p className="text-xs text-slate-400">{t.catalogSub}</p>
                        </div>

                        {/* Filter Controls Row */}
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                          {/* Tested/Recommended Badge Buttons */}
                          <div className="flex bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-1 shrink-0 shadow-3xs">
                            <button
                              onClick={() => setBadgeFilter('all')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                badgeFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setBadgeFilter('tested')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                badgeFilter === 'tested' ? 'bg-emerald-500/10 text-emerald-600' : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              Tested
                            </button>
                            <button
                              onClick={() => setBadgeFilter('trending')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                badgeFilter === 'trending' ? 'bg-red-500/10 text-red-600' : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              Trending
                            </button>
                          </div>

                          {/* Sort Dropdown */}
                          <select
                            value={sortOption}
                            onChange={e => setSortOption(e.target.value as any)}
                            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] font-bold rounded-xl px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:border-[#FF5A00] shrink-0 cursor-pointer shadow-3xs"
                          >
                            <option value="popular">Popularity</option>
                            <option value="latest">New Arrivals</option>
                            <option value="low-price">Lowest Price</option>
                            <option value="discount">Highest Discount</option>
                          </select>
                        </div>
                      </div>

                      {/* Catalog Grid */}
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl max-w-md mx-auto shadow-sm">
                          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{t.emptyCatalog}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {filteredProducts.map(p => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              onOpenProduct={handleOpenProduct}
                              isWishlisted={wishlist.includes(p.id)}
                              onToggleWishlist={handleToggleWishlist}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: WISHLIST / COLLECTIONS */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-display">Your Saved Curations</h2>
                      <p className="text-xs text-slate-400">Fast access to products you are planning to purchase.</p>
                    </div>

                    {wishlist.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl max-w-sm mx-auto shadow-sm">
                        <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Your Wishlist is empty.</p>
                        <button
                          onClick={() => setActiveTab('home')}
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

                        {/* Dark mode */}
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">Interface Aesthetics</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Enable modern dark color tones</p>
                          </div>
                          <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl text-[10px] transition-colors cursor-pointer"
                          >
                            {darkMode ? 'Dark Slate' : 'Light Paper'}
                          </button>
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
                  </div>
                )}

                {/* TAB 5: ADMIN HQ PANEL with real-time firestore updates */}
                {activeTab === 'admin' && isAdmin && (
                  <AdminPanel
                    products={products}
                    categories={categories}
                    reels={reels}
                    analytics={analytics}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddReel={handleAddReel}
                    onUpdateReel={handleUpdateReel}
                    onDeleteReel={handleDeleteReel}
                  />
                )}

              </div>
            )}

          </main>
        )}
      </div>

      {/* FLOAT AI ASSISTANT BUTTON */}
      <OnBudgetAI products={products} onOpenProduct={handleOpenProduct} />

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
                  <span>You are subscribed to exclusive budget alerts!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    placeholder={t.newsPlaceholder}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] dark:focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {t.newsButton}
                  </button>
                </form>
              )}
            </div>

            {/* Column 2: Social Channels */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white font-display">{t.channels}</h3>
              <div className="space-y-3 text-xs">
                <a
                  href="https://t.me/mock-onbudget-channel"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-850/60 border border-slate-200/50 dark:border-slate-850 rounded-2xl transition-all group shadow-3xs"
                >
                  <div className="w-8 h-8 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white group-hover:text-[#FF5A00] transition-colors font-display">{t.tgTitle}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.tgSub}</p>
                  </div>
                </a>

                <a
                  href="https://wa.me/mock-onbudget-channel"
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
                <button onClick={() => { setActiveTab('home'); setSelectedCategory('desk-setup'); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Desk Setups</button>
                <button onClick={() => { setActiveTab('home'); setSelectedCategory('gaming'); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Gaming Gear</button>
                <button onClick={() => { setActiveTab('home'); setSelectedCategory('tech'); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Tech & Gadgets</button>
                <button onClick={() => { setActiveTab('home'); setSelectedPriceRange(99); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Best under ₹99</button>
                <button onClick={() => { setActiveTab('home'); setSelectedPriceRange(199); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Best under ₹199</button>
                <button onClick={() => { setActiveTab('home'); setSelectedPriceRange(499); }} className="text-left hover:text-[#FF5A00] transition-colors cursor-pointer">Best under ₹499</button>
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
                setActiveTab('home');
                window.history.pushState({}, '', '/');
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
                  setActiveTab('home');
                  window.history.pushState({}, '', '/');
                }}
                className="w-full bg-[#FF5A00] hover:bg-[#E04F00] text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5A00]/10 cursor-pointer transition-colors"
              >
                Return to Explore
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
