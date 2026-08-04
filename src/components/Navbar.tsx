import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Search, Bell, Heart, User, Layout, Menu, X,
  Shield, Check, ArrowRight, LogIn, LogOut, Mail, Lock, Info, Eye, EyeOff, ShieldAlert,
  Phone, Smartphone, ArrowLeft, ChevronDown, KeyRound
} from 'lucide-react';
import { NotificationItem, Category, ADMIN_EMAILS } from '../types';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser
} from '../firebase/auth';
import { syncUserProfile } from '../firebase/firestore';
import { updateProfile, User as FirebaseUser } from 'firebase/auth';
import { useToast } from './Toast';
import inOurBudgetLogo from '../assets/images/in_our_budget_logo_1784107312483.jpg';
import CurrencySwitcher from './CurrencySwitcher';

interface NavbarProps {
  activeTab: 'home' | 'wishlist' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'wishlist' | 'profile' | 'admin') => void;
  categories: Category[];
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onVoiceSearch: () => void;
  user: any;
  currentCurrency?: string;
  onCurrencyChange?: (code: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (categoryName: string) => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  categories,
  notifications,
  onMarkNotificationsRead,
  searchQuery,
  setSearchQuery,
  onVoiceSearch,
  user,
  currentCurrency = 'INR',
  onCurrencyChange = () => {},
  selectedCategory = '',
  onSelectCategory = () => {},
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthUnconfigured, setIsAuthUnconfigured] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Listen for Wishlist updates to show live badge in bottom nav bar
  useEffect(() => {
    const updateWishlistCount = () => {
      try {
        const saved = localStorage.getItem('onbudget_wishlist');
        if (saved) {
          const list = JSON.parse(saved);
          setWishlistCount(Array.isArray(list) ? list.length : 0);
        } else {
          setWishlistCount(0);
        }
      } catch {
        setWishlistCount(0);
      }
    };

    updateWishlistCount();
    window.addEventListener('storage', updateWishlistCount);
    window.addEventListener('onbudget_wishlist_updated', updateWishlistCount);
    return () => {
      window.removeEventListener('storage', updateWishlistCount);
      window.removeEventListener('onbudget_wishlist_updated', updateWishlistCount);
    };
  }, []);

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthError(null);
  };

  const toast = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotifClick = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      onMarkNotificationsRead();
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      toast.success('Successfully logged in with Google!');
      setAuthModalOpen(false);
      setIsAuthUnconfigured(false);
    } catch (err: any) {
      const msg = err.message || '';
      const isUnconfigured = msg.includes('Authentication is not configured') || msg.includes('operation-not-allowed');
      if (isUnconfigured) {
        setIsAuthUnconfigured(true);
      } else {
        const cleanMsg = 'Google sign-in failed. Please try again.';
        setAuthError(cleanMsg);
        toast.error(cleanMsg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    // Client-side validations
    if (authMode === 'signup' && !authName.trim()) {
      setAuthError('Please enter your name.');
      toast.error('Please enter your name.');
      setAuthLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      setAuthLoading(false);
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      toast.error('Password must be at least 6 characters.');
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'signin') {
        await signInWithEmail(authEmail, authPassword);
        toast.success('Successfully logged in!');
      } else {
        const newUser = await signUpWithEmail(authEmail, authPassword);
        if (authName.trim() && newUser) {
          await updateProfile(newUser, {
            displayName: authName
          });
        }
        toast.success('Account successfully created! Welcome!');
      }
      setAuthModalOpen(false);
      // Reset form
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setIsAuthUnconfigured(false);
    } catch (err: any) {
      const msg = err.message || '';
      const isUnconfigured = msg.includes('Authentication is not configured') || msg.includes('operation-not-allowed');
      if (isUnconfigured) {
        setIsAuthUnconfigured(true);
      } else if (authMode === 'signin') {
        const cleanMsg = 'Invalid email or password. Please verify your credentials and try again.';
        setAuthError(cleanMsg);
        toast.error(cleanMsg);
      } else {
        const cleanMsg = 'Unable to create account. Please check your credentials and try again.';
        setAuthError(cleanMsg);
        toast.error(cleanMsg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success('Logged out successfully.');
      setActiveTab('home');
    } catch (err: any) {
      toast.error(err.message || 'Failed to log out.');
    }
  };

  const isAdmin = !!(user && (
    (user.email && ADMIN_EMAILS.includes(user.email))
  ));

  const navItems = [
    { id: 'home', name: 'Explore', icon: Layout },
    { id: 'wishlist', name: 'Wishlist', icon: Heart },
    { id: 'profile', name: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'admin', name: 'Admin Console', icon: Shield }] : []),
  ] as const;

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-1.5 sm:gap-4 w-full max-w-full overflow-hidden">
            
            {/* LOGO */}
            <div
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center cursor-pointer shrink shrink-0 min-w-0 max-w-[110px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-none"
              id="navbar-logo"
            >
              <div className="bg-white p-0.5 sm:p-1 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-2xs">
                <img
                  src={inOurBudgetLogo}
                  alt="In Our Budget Logo"
                  className="h-7 sm:h-9 md:h-10 w-auto object-contain max-w-full hover:scale-102 transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:flex flex-1 max-w-md relative" id="navbar-search">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search gadgets, desk setups, under ₹200..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] dark:focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-full px-5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={onVoiceSearch}
                  className="p-1 text-slate-400 hover:text-[#FF5A00] transition-colors"
                  title="Voice Search"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 hover:text-[#FF5A00]" />
                </button>
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* DESKTOP NAV TABS */}
            <div className="hidden md:flex items-center gap-1.5" id="navbar-tabs">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* HEADER ICONS */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0" id="navbar-actions">
              {/* Currency Switcher */}
              <CurrencySwitcher
                currentCurrency={currentCurrency}
                onCurrencyChange={onCurrencyChange}
                compact
              />

              {/* Notifications Popover */}
              <div className="relative shrink-0">
                <button
                  onClick={handleNotifClick}
                  className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition-all relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#FF5A00] text-[8px] sm:text-[9px] text-white font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display">Alerts & Price Drops</span>
                          <span className="text-[10px] bg-[#FF5A00]/10 text-[#FF5A00] font-bold px-2 py-0.5 rounded-full uppercase">
                            New
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto scrollbar-thin">
                          {notifications.length === 0 ? (
                            <p className="p-6 text-center text-xs text-slate-400">No active promotions or alerts.</p>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors flex gap-2.5">
                                <div className="w-7 h-7 bg-[#FF5A00]/10 rounded-lg flex items-center justify-center text-[#FF5A00] shrink-0 border border-[#FF5A00]/15 mt-0.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{n.title}</h4>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.description}</p>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block mt-1">{n.date}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User Account Controls */}
              {user ? (
                <div className="relative group shrink-0">
                  <button className="flex items-center p-0.5 sm:p-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full transition-all cursor-pointer">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FF5A00]/10 text-[#FF5A00] rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase">
                        {user.displayName ? user.displayName.slice(0, 1) : user.email?.slice(0, 1) || 'U'}
                      </div>
                    )}
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl hidden group-hover:block hover:block z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-950 dark:text-white truncate">
                        {user.displayName || 'Budget Explorer'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        My Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1 p-1.5 sm:px-3.5 sm:py-2 bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5A00]/15 transition-all cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 sm:p-2 md:hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
                aria-label="Toggle Mobile Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SUB-SEARCH BAR */}
        <div className="md:hidden px-3 sm:px-4 pb-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 w-full max-w-full overflow-hidden">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search gadgets, desk setups, under ₹200..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-[#FF5A00] dark:focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-full pl-9 pr-16 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onVoiceSearch}
                className="p-1 text-slate-400 hover:text-[#FF5A00] transition-colors cursor-pointer"
                title="Voice Search"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A00]" />
              </button>
            </div>
          </div>
        </div>

        {/* BACKDROP FOR MOBILE MENU */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[100px] sm:top-[120px] bg-slate-950/40 backdrop-blur-2xs z-30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* MOBILE NAV DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl relative z-40"
            >
              <div className="p-4 space-y-4">
                {/* User Profile Card or Guest Banner */}
                {user ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="User"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#FF5A00]/15 text-[#FF5A00] rounded-full flex items-center justify-center font-black text-sm uppercase shrink-0 border border-[#FF5A00]/20">
                          {user.displayName ? user.displayName.slice(0, 1) : user.email?.slice(0, 1) || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-display">
                            {user.displayName || 'Budget Explorer'}
                          </p>
                          {isAdmin && (
                            <span className="text-[9px] bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/20 font-bold px-1.5 py-0.2 rounded uppercase font-mono shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setMobileMenuOpen(false);
                      }}
                      className="text-[10px] text-[#FF5A00] font-bold hover:underline shrink-0 font-display"
                    >
                      View Profile
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-[#FF5A00]/10 to-amber-500/10 dark:from-[#FF5A00]/15 dark:to-amber-500/15 rounded-2xl border border-[#FF5A00]/20 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">Sign In to On Budget</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Save wishlist items & submit reviews</p>
                    </div>
                    <button
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError(null);
                        setAuthModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="px-3.5 py-2 bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5A00]/15 shrink-0 transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {/* Primary Navigation Tabs */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 font-display">
                    Navigation
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {navItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id as any);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                              : 'bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                          {item.id === 'wishlist' && wishlistCount > 0 && (
                            <span className={`ml-auto text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                              isActive ? 'bg-white text-[#FF5A00]' : 'bg-[#FF5A00] text-white'
                            }`}>
                              {wishlistCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories Quick Chips */}
                {categories && categories.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 font-display">
                      Explore Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <button
                        onClick={() => {
                          onSelectCategory('');
                          setActiveTab('home');
                          setMobileMenuOpen(false);
                        }}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-display ${
                          selectedCategory === ''
                            ? 'bg-[#FF5A00]/10 text-[#FF5A00] border-[#FF5A00]/30 font-black'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectCategory(c.name);
                            setActiveTab('home');
                            setMobileMenuOpen(false);
                          }}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-display flex items-center gap-1.5 ${
                            selectedCategory === c.name
                              ? 'bg-[#FF5A00]/10 text-[#FF5A00] border-[#FF5A00]/30 font-black'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <span>{c.icon}</span>
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display Preferences */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 font-display">
                    Preferences
                  </span>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Currency</span>
                    <CurrencySwitcher
                      currentCurrency={currentCurrency}
                      onCurrencyChange={onCurrencyChange}
                      compact
                    />
                  </div>
                </div>

                {/* Logout Button if Logged In */}
                {user && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-900/30 transition-colors cursor-pointer font-display"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Account</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* AUTHENTICATION MODAL */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeAuthModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden z-10"
            >
              {/* Close Button */}
              <button
                onClick={closeAuthModal}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                {/* Modal Header */}
                <div className="text-center">
                  <div className="inline-flex mb-3 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                    <img
                      src={inOurBudgetLogo}
                      alt="In Our Budget"
                      className="w-14 h-14 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white font-display">
                    {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Save your wishlist, follow dynamic pricing, and submit real reviews.
                  </p>
                </div>

                {/* Error Panel or Setup Warning */}
                {isAuthUnconfigured ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
                      <span>Setup Firebase Auth Providers</span>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      Authentication is not configured. Please enable Email/Password and Google in Firebase Console:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 font-medium">
                      <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#FF5A00] hover:text-[#E04F00]">Firebase Console</a>.</li>
                      <li>Select your project, then click <strong>Authentication</strong> in the sidebar.</li>
                      <li>Go to the <strong>Sign-in method</strong> tab.</li>
                      <li>Enable <strong>Email/Password</strong> and <strong>Google</strong> providers.</li>
                      <li>Click save, then reload this page and try again!</li>
                    </ol>
                  </div>
                ) : authError ? (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl flex items-center gap-2.5">
                    <Info className="w-4 h-4 shrink-0 text-red-500" />
                    <span className="leading-normal font-medium">{authError}</span>
                  </div>
                ) : null}

                {/* Main Auth Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={e => setAuthName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setAuthError('Password reset link is coming soon! Please check your credentials or log in with Google.')}
                          className="text-[10px] text-[#FF5A00] font-bold hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-[#FF5A00] absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#FF5A00] hover:bg-[#E04F00] text-white py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5A00]/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {authLoading ? (
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{authMode === 'signin' ? 'Sign In with Email' : 'Create My Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or Continue With</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.39 3.62v3h3.86c2.26-2.08 3.67-5.14 3.67-8.45z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.12C3.26 22.27 7.4 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29a7.18 7.18 0 0 1 0-4.58V6.59H1.29a11.94 11.94 0 0 0 0 10.82l3.98-3.12z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.4 0 3.26 1.73 1.29 4.75l3.98 3.12c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>Google Account</span>
                </button>

                {/* Switch Sign In / Sign Up */}
                <div className="text-center pt-2 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                        setAuthError(null);
                      }}
                      className="text-[#FF5A00] font-bold hover:underline ml-1.5 cursor-pointer"
                    >
                      {authMode === 'signin' ? 'Create one now' : 'Sign in here'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
