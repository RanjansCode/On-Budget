import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Search, Bell, Heart, User, Layout, Menu, X, Sun, Moon,
  Shield, Check, ArrowRight, LogIn, LogOut, Mail, Lock, Info, Eye, EyeOff, ShieldAlert,
  Phone, Smartphone, ArrowLeft, ChevronDown, KeyRound
} from 'lucide-react';
import { NotificationItem, Category, ADMIN_EMAILS, ADMIN_PHONES } from '../types';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser,
  sendOtpToPhone,
  RecaptchaVerifier
} from '../firebase/auth';
import { syncUserProfile } from '../firebase/firestore';
import { updateProfile, User as FirebaseUser } from 'firebase/auth';
import { useToast } from './Toast';

interface NavbarProps {
  activeTab: 'home' | 'wishlist' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'wishlist' | 'profile' | 'admin') => void;
  categories: Category[];
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onVoiceSearch: () => void;
  user: FirebaseUser | null;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  categories,
  notifications,
  onMarkNotificationsRead,
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
  onVoiceSearch,
  user,
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

  // --- Phone Authentication State ---
  const [authType, setAuthType] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(''));
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first OTP input box when OTP screen loads
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [otpSent]);

  // Countdown for Resend OTP
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const getOrCreateRecaptchaVerifier = () => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    try {
      // Invisible Recaptcha
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // Solved
        },
        'expired-callback': () => {
          toast.error('reCAPTCHA expired. Please try again.');
        }
      });
      (window as any).recaptchaVerifier = verifier;
      setRecaptchaVerifier(verifier);
      return verifier;
    } catch (err: any) {
      console.error('reCAPTCHA initialization error:', err);
      toast.error('Failed to initialize security reCAPTCHA.');
      return null;
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    // Clean and parse phone number
    let cleaned = phoneNumber.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+91')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }

    // Validate Indian mobile numbers
    const isIndia = countryCode === '+91';
    if (isIndia) {
      const indiaRegex = /^[6-9]\d{9}$/;
      if (!indiaRegex.test(cleaned)) {
        const errorMsg = 'Please enter a valid 10-digit Indian mobile number starting with 6-9.';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        setAuthLoading(false);
        return;
      }
    } else {
      if (cleaned.length < 7 || cleaned.length > 15) {
        const errorMsg = 'Please enter a valid mobile number.';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        setAuthLoading(false);
        return;
      }
    }

    const fullPhoneNumber = countryCode + cleaned;

    try {
      const verifier = getOrCreateRecaptchaVerifier();
      if (!verifier) {
        throw new Error('reCAPTCHA verifier could not be created.');
      }

      const confirmation = await sendOtpToPhone(fullPhoneNumber, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setOtpCountdown(30);
      setOtpCode(Array(6).fill(''));
      toast.success(`OTP sent successfully to ${fullPhoneNumber}`);
    } catch (err: any) {
      console.error('Failed to send OTP:', err);
      const isUnconfigured = err.message?.includes('Authentication is not configured') || err.message?.includes('operation-not-allowed');
      if (isUnconfigured) {
        setIsAuthUnconfigured(true);
      }
      const msg = err.message || 'Failed to send OTP. Please check your phone number.';
      setAuthError(msg);
      toast.error(msg);
      
      // Reset reCAPTCHA on failure
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
          setRecaptchaVerifier(null);
        } catch (e) {
          console.error(e);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const codeString = otpCode.join('');
    if (codeString.length !== 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (!confirmationResult) {
        throw new Error('No active verification session. Please request a new OTP.');
      }

      const credential = await confirmationResult.confirm(codeString);
      const loggedUser = credential.user;

      if (loggedUser) {
        const profile = await syncUserProfile(loggedUser);
        toast.success(`Welcome back ${profile.displayName || loggedUser.phoneNumber || 'User'}!`);
        closeAuthModal();
      }
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      const msg = err.message || 'The OTP verification code is incorrect. Please verify and try again.';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const numericVal = val.replace(/\D/g, '');
    if (!numericVal) {
      const newOtp = [...otpCode];
      newOtp[index] = '';
      setOtpCode(newOtp);
      return;
    }

    const digit = numericVal[numericVal.length - 1];
    const newOtp = [...otpCode];
    newOtp[index] = digit;
    setOtpCode(newOtp);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpCode[index] && index > 0) {
        const newOtp = [...otpCode];
        newOtp[index - 1] = '';
        setOtpCode(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpCode];
        newOtp[index] = '';
        setOtpCode(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otpCode];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtpCode(newOtp);

      const nextFocusIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[nextFocusIndex]?.focus();
    }
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthError(null);
    setPhoneNumber('');
    setOtpSent(false);
    setOtpCode(Array(6).fill(''));
    setConfirmationResult(null);
    setAuthType('email');
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
      }
      setAuthError(msg);
      toast.error(msg);
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
      }
      setAuthError(msg);
      toast.error(msg);
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
    (user.email && ADMIN_EMAILS.includes(user.email)) ||
    (user.phoneNumber && ADMIN_PHONES.includes(user.phoneNumber))
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* LOGO */}
            <div
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 cursor-pointer shrink-0"
              id="navbar-logo"
            >
              <div className="w-10 h-10 bg-[#FF5A00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5A00]/20 hover:scale-105 transition-transform duration-200">
                <span className="text-white font-black text-xl font-display">₹</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase leading-none font-display">
                  On Budget
                </span>
                <span className="text-[10px] text-[#FF5A00] font-bold uppercase tracking-widest mt-1">
                  Tested Curations
                </span>
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
            <div className="flex items-center gap-2 shrink-0" id="navbar-actions">
              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notifications Popover */}
              <div className="relative">
                <button
                  onClick={handleNotifClick}
                  className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition-all relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A00] text-[9px] text-white font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">
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
                        className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
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
                <div className="relative group">
                  <button className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full transition-all cursor-pointer">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-7 h-7 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-[#FF5A00]/10 text-[#FF5A00] rounded-full flex items-center justify-center font-bold text-xs uppercase">
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5A00]/15 transition-all cursor-pointer scale-100 active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 md:hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE NAV DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search gadgets, budgets..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-full px-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold tracking-wide text-left transition-all cursor-pointer ${
                          activeTab === item.id
                            ? 'bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/15'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
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
                  <div className="inline-flex w-12 h-12 bg-[#FF5A00]/10 rounded-2xl items-center justify-center text-[#FF5A00] mb-3">
                    <span className="text-xl font-extrabold font-display">₹</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white font-display">
                    {authType === 'phone' 
                      ? (otpSent ? 'Verify OTP Code' : 'Mobile OTP Sign In') 
                      : (authMode === 'signin' ? 'Welcome back' : 'Create your account')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Save your wishlist, follow dynamic pricing, and submit real reviews.
                  </p>
                </div>

                {/* Error Panel or Setup Warning */}
                {isAuthUnconfigured ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                      <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Setup Firebase Auth Providers</span>
                    </div>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                      Authentication is not configured. Please enable Email/Password, Google, and Phone in Firebase Console:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#FF5A00] hover:text-[#E04F00]">Firebase Console</a>.</li>
                      <li>Select your project, then click <strong>Authentication</strong> in the sidebar.</li>
                      <li>Go to the <strong>Sign-in method</strong> tab.</li>
                      <li>Enable <strong>Email/Password</strong>, <strong>Google</strong>, and <strong>Phone</strong> providers.</li>
                      <li>Click save, then reload this page and try again!</li>
                    </ol>
                  </div>
                ) : authError ? (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-2xl flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-normal">{authError}</span>
                  </div>
                ) : null}

                {/* Auth Type Tabs */}
                {!otpSent && (
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setAuthType('email'); setAuthError(null); }}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        authType === 'email'
                          ? 'bg-white dark:bg-slate-900 text-[#FF5A00] shadow-sm'
                          : 'text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      Email Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthType('phone'); setAuthError(null); }}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        authType === 'phone'
                          ? 'bg-white dark:bg-slate-900 text-[#FF5A00] shadow-sm'
                          : 'text-slate-500 hover:text-slate-755 dark:text-slate-400 dark:hover:text-slate-300'
                      }`}
                    >
                      Mobile OTP (India)
                    </button>
                  </div>
                )}

                {/* Conditional forms based on authType */}
                {authType === 'email' ? (
                  <>
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
                    <div className="text-center pt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                            setAuthError(null);
                          }}
                          className="text-[#FF5A00] font-bold hover:underline ml-1.5"
                        >
                          {authMode === 'signin' ? 'Create one now' : 'Sign in here'}
                        </button>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Phone Authentication */}
                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Mobile Number</label>
                          <div className="flex gap-2">
                            {/* Country Selector */}
                            <div className="relative shrink-0">
                              <select
                                value={countryCode}
                                onChange={e => setCountryCode(e.target.value)}
                                className="appearance-none w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FF5A00] font-medium cursor-pointer"
                              >
                                <option value="+91">🇮🇳 +91</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+61">🇦🇺 +61</option>
                                <option value="+65">🇸🇬 +65</option>
                                <option value="+971">🇦🇪 +971</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* Mobile Number Input */}
                            <div className="relative flex-1">
                              <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                placeholder="9876543210"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-medium"
                              />
                              <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                          {countryCode === '+91' && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                              Enter a 10-digit Indian mobile number. Pre-existing country codes like +91 are parsed automatically.
                            </p>
                          )}
                        </div>

                        {/* Hidden ReCAPTCHA container */}
                        <div id="recaptcha-container" className="hidden"></div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full bg-[#FF5A00] hover:bg-[#E04F00] text-white py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5A00]/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          {authLoading ? (
                            <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Continue</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setOtpSent(false); setAuthError(null); }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Change Mobile Number</span>
                          </div>
                          
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            We sent a 6-digit verification code to <strong className="text-slate-900 dark:text-white">{countryCode} {phoneNumber}</strong>.
                          </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">
                              Enter 6-Digit OTP Code
                            </label>
                            <div className="flex justify-between gap-2 max-w-[280px] mx-auto" onPaste={handleOtpPaste}>
                              {otpCode.map((digit, idx) => (
                                <input
                                  key={idx}
                                  ref={(el) => (otpInputsRef.current[idx] = el)}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={1}
                                  value={digit}
                                  onChange={e => handleOtpChange(idx, e.target.value)}
                                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                                  className="w-10 h-12 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none transition-all shadow-sm"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <button
                              type="submit"
                              disabled={authLoading}
                              className="w-full bg-[#FF5A00] hover:bg-[#E04F00] text-white py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5A00]/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                              {authLoading ? (
                                <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Verify OTP</span>
                                  <Check className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            {/* Resend Logic */}
                            <div className="text-center">
                              {otpCountdown > 0 ? (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                  Resend code in <strong className="text-[#FF5A00] font-bold">{otpCountdown}s</strong>
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSendOtp()}
                                  disabled={authLoading}
                                  className="text-[11px] text-[#FF5A00] font-bold hover:underline"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
