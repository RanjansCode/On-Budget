/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, KeyRound, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { LaunchSettings } from '../firebase/firestore';

interface LaunchModeOverlayProps {
  settings: LaunchSettings;
  onCountdownComplete: () => void;
  isAdmin: boolean;
  onAdminBypass: () => void;
}

export default function LaunchModeOverlay({
  settings,
  onCountdownComplete,
  isAdmin,
  onAdminBypass,
}: LaunchModeOverlayProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 1 });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const { launchDate, launchTime, timezone } = settings;

  useEffect(() => {
    function updateTimer() {
      const cleanTz = (timezone || '+05:30').replace('GMT', '').trim();
      const targetStr = `${launchDate}T${launchTime}:00${cleanTz}`;
      let targetTime = new Date(targetStr).getTime();

      if (isNaN(targetTime)) {
        try {
          const [year, month, day] = launchDate.split('-').map(Number);
          const [hours, minutes] = launchTime.split(':').map(Number);
          targetTime = new Date(year, month - 1, day, hours, minutes).getTime();
        } catch (e) {
          targetTime = NaN;
        }
      }

      const now = Date.now();
      const totalMs = targetTime - now;

      if (isNaN(targetTime) || totalMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        onCountdownComplete();
        return;
      }

      const seconds = Math.floor((totalMs / 1000) % 60);
      const minutes = Math.floor((totalMs / 1000 / 60) % 60);
      const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
      const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

      setCountdown({ days, hours, minutes, seconds, totalMs });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [launchDate, launchTime, timezone, onCountdownComplete]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '0013') {
      setPinError('');
      onAdminBypass();
    } else {
      setPinError('Incorrect PIN. Admin authorization failed.');
      setPinInput('');
    }
  };

  return (
    <div
      id="launch-overlay-root"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/75 backdrop-blur-[16px] overflow-y-auto"
      style={{ touchAction: 'none' }}
    >
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF7A00]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glassmorphism card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        id="launch-card"
        className="relative w-full max-w-lg bg-neutral-900/60 border border-white/10 p-8 sm:p-10 rounded-[32px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md text-center space-y-8 overflow-hidden"
      >
        {/* Subtle orange accent outline */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FF7A00] to-transparent" />

        {/* Brand Logo */}
        <div className="flex justify-center" id="launch-logo-container">
          <img
            src="src/assets/image/logo_inourbudget.png"
            alt="In Our Budget"
            className="h-12 sm:h-14 object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=120';
            }}
          />
        </div>

        {/* Titles */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            We're Launching Soon <span className="inline-block animate-bounce">🚀</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-sm mx-auto font-medium">
            Our platform is almost ready. Stay tuned.
          </p>
        </div>

        {/* Live Countdown Timer Block */}
        <div className="space-y-3" id="launch-countdown-block">
          <span className="text-[10px] font-black tracking-widest text-[#FF7A00] uppercase block">
            Launch In
          </span>

          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-sm mx-auto">
            {/* Days */}
            <div className="bg-black/50 border border-white/5 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {String(countdown.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="bg-black/50 border border-white/5 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                Hours
              </span>
            </div>

            {/* Minutes */}
            <div className="bg-black/50 border border-white/5 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                Minutes
              </span>
            </div>

            {/* Seconds */}
            <div className="bg-black/50 border border-[#FF7A00]/20 p-3 rounded-2xl flex flex-col justify-center ring-1 ring-[#FF7A00]/5">
              <span className="text-2xl sm:text-3xl font-black text-[#FF7A00] font-mono tracking-tight">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* Footer Announcement */}
        <div className="pt-4 border-t border-white/5 max-w-sm mx-auto">
          <p className="text-[11px] text-neutral-400 font-semibold italic">
            "Thank you for your patience. We're preparing something amazing for you."
          </p>
        </div>
      </motion.div>

      {/* Admin Quick Entry / Lock override button */}
      <div className="absolute bottom-6 right-6 z-20">
        {isAdmin ? (
          <button
            onClick={onAdminBypass}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer hover:bg-neutral-850"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF7A00]" /> Admin Terminal
          </button>
        ) : (
          <button
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:bg-neutral-900"
          >
            <KeyRound className="w-3.5 h-3.5" /> Admin Access
          </button>
        )}
      </div>

      {/* Admin Authentication overlay drawer */}
      <AnimatePresence>
        {showAdminLogin && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl text-center space-y-4">
              <div className="w-10 h-10 bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Admin Verification</h3>
                <p className="text-[10px] text-neutral-400 mt-1">Please enter the admin PIN to bypass the launch blur.</p>
              </div>

              <form onSubmit={handleAdminAuth} className="space-y-3">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-widest text-base font-bold bg-neutral-950 border border-neutral-800 focus:border-[#FF7A00] rounded-xl py-2.5 text-white focus:outline-none"
                />
                {pinError && <p className="text-red-400 text-[10px] font-medium">{pinError}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminLogin(false);
                      setPinError('');
                      setPinInput('');
                    }}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#FF7A00] hover:bg-[#E06C00] text-white text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Authorize
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
