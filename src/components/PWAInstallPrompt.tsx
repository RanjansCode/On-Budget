import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Sparkles, RefreshCw } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // 1. Check if app is running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    // 2. Listen for PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);

      // Check if user dismissed prompt recently (within 7 days)
      const dismissedTime = localStorage.getItem('inourbudget_pwa_dismissed');
      const now = Date.now();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

      if (!dismissedTime || now - parseInt(dismissedTime, 10) > SEVEN_DAYS) {
        setShowPrompt(true);
      }
    };

    // 3. Listen for appinstalled event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('[PWA] In Our Budget app installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Listen for Service Worker update available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setSwUpdateAvailable(true);
                }
              });
            }
          });
        }
      });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('inourbudget_pwa_dismissed', Date.now().toString());
  };

  const handleUpdateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (isStandalone && !swUpdateAvailable) return null;

  return (
    <>
      {/* Service Worker Update Toast */}
      <AnimatePresence>
        {swUpdateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-neutral-900 border border-neutral-700 text-white rounded-2xl p-4 shadow-2xl max-w-sm w-full flex items-center justify-between gap-3 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#FF5A00]/20 border border-[#FF5A00]/40 rounded-xl flex items-center justify-center text-[#FF5A00] shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display text-white">App Update Ready</h4>
                <p className="text-[11px] text-neutral-400">A new version of In Our Budget is available.</p>
              </div>
            </div>
            <button
              onClick={handleUpdateApp}
              className="bg-[#FF5A00] hover:bg-[#e04f00] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0 shadow-md flex items-center gap-1.5"
            >
              Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showPrompt && !isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-md bg-neutral-900/95 border border-neutral-800 backdrop-blur-xl p-4 rounded-3xl shadow-2xl text-white space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-2xl p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                  <img src="/icons/icon-192.png" alt="In Our Budget App Icon" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold font-display text-white">Install In Our Budget</h3>
                    <span className="bg-[#FF5A00]/20 text-[#FF5A00] text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#FF5A00]/30 uppercase">
                      PWA
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    Get faster access, deal alerts & a clean full-screen app experience.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer shrink-0"
                aria-label="Close Install Prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800/40 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-center"
              >
                Not Now
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-2 py-2 px-4 text-xs font-bold text-white bg-[#FF5A00] hover:bg-[#e04f00] rounded-xl shadow-lg shadow-[#FF5A00]/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
