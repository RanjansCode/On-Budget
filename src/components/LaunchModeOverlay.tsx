/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, PartyPopper } from 'lucide-react';
import { LaunchSettings } from '../firebase/firestore';

interface LaunchModeOverlayProps {
  settings: LaunchSettings;
  onCountdownComplete: () => void;
  isAdmin: boolean;
}

type SequencePhase = 'timer' | 'countdown_3' | 'countdown_2' | 'countdown_1' | 'celebrate' | 'completed';

// High-performance particle for dual party-popper / confetti bursts
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  width: number;
  height: number;
  color: string;
  shape: 'rect' | 'circle' | 'strip';
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  gravity: number;
  drag: number;
}

const CONFETTI_COLORS = [
  '#FF7A00', // Brand Orange
  '#FFA800', // Amber
  '#FFD700', // Gold
  '#FF3366', // Crimson Pink
  '#00E5FF', // Electric Cyan
  '#7C3AED', // Vivid Violet
  '#10B981', // Emerald
  '#FFFFFF', // White Sparkle
];

export default function LaunchModeOverlay({
  settings,
  onCountdownComplete,
  isAdmin,
}: LaunchModeOverlayProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 1 });
  const [phase, setPhase] = useState<SequencePhase>('timer');
  const [activeNumber, setActiveNumber] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sequenceTriggeredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const { launchDate, launchTime, timezone } = settings;

  // 1. Countdown timer calculation
  useEffect(() => {
    function updateTimer() {
      // If sequence is already in progress, ignore regular timer updates
      if (sequenceTriggeredRef.current) return;

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
      const totalMs = isNaN(targetTime) ? 0 : targetTime - now;

      // If already expired in the past (> 5 seconds ago) when user loads the page for the first time,
      // or already marked as seen in session, switch directly to live state without repeated animation.
      const alreadyCelebrated = sessionStorage.getItem('onbudget_launch_celebration_done') === 'true';

      if (isNaN(targetTime) || totalMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

        if (alreadyCelebrated || totalMs < -5000) {
          // Skip sequence if already expired long ago or already viewed
          onCountdownComplete();
          return;
        }

        // Trigger 3-2-1 launch sequence once
        if (!sequenceTriggeredRef.current) {
          sequenceTriggeredRef.current = true;
          startLiveLaunchSequence();
        }
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

  // 2. Launch Sequence: 3 -> 2 -> 1 -> Party Popper Confetti + "We're Live!"
  const startLiveLaunchSequence = () => {
    // Step 1: Number 3
    setPhase('countdown_3');
    setActiveNumber(3);

    // Step 2: Number 2 after 1000ms
    setTimeout(() => {
      setPhase('countdown_2');
      setActiveNumber(2);
    }, 1000);

    // Step 3: Number 1 after 2000ms
    setTimeout(() => {
      setPhase('countdown_1');
      setActiveNumber(1);
    }, 2000);

    // Step 4: Live celebration & Confetti burst after 3000ms (at 1 completion)
    setTimeout(() => {
      setActiveNumber(null);
      setPhase('celebrate');
      sessionStorage.setItem('onbudget_launch_celebration_done', 'true');
      triggerDualConfettiCannons();

      // Step 5: After 4.2 seconds of celebration, finalize launch mode
      setTimeout(() => {
        setPhase('completed');
        onCountdownComplete();
      }, 4200);
    }, 3000);
  };

  // 3. Canvas Party-Popper Confetti Physics Engine (Shoots from left and right edges towards center)
  const triggerDualConfettiCannons = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to full viewport
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const particles: ConfettiParticle[] = [];
    const particleCount = Math.min(window.innerWidth < 640 ? 140 : 220, 240);

    // Left cannon (originates from bottom-left, fires towards top-right/center)
    for (let i = 0; i < particleCount / 2; i++) {
      const angle = (-Math.PI / 4) + (Math.random() * 0.4 - 0.2); // ~-45 degrees towards top-right
      const speed = Math.random() * 16 + 14;
      const isStrip = Math.random() > 0.4;

      particles.push({
        x: Math.random() * 50,
        y: height * 0.85 + Math.random() * 50,
        vx: Math.cos(angle) * speed * (0.9 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.9 + Math.random() * 0.5),
        size: Math.random() * 6 + 4,
        width: isStrip ? Math.random() * 14 + 10 : Math.random() * 8 + 6,
        height: isStrip ? Math.random() * 6 + 4 : Math.random() * 8 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: isStrip ? 'strip' : Math.random() > 0.5 ? 'rect' : 'circle',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        opacity: 1,
        gravity: 0.35 + Math.random() * 0.15,
        drag: 0.975,
      });
    }

    // Right cannon (originates from bottom-right, fires towards top-left/center)
    for (let i = 0; i < particleCount / 2; i++) {
      const angle = (-3 * Math.PI / 4) + (Math.random() * 0.4 - 0.2); // ~-135 degrees towards top-left
      const speed = Math.random() * 16 + 14;
      const isStrip = Math.random() > 0.4;

      particles.push({
        x: width - Math.random() * 50,
        y: height * 0.85 + Math.random() * 50,
        vx: Math.cos(angle) * speed * (0.9 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.9 + Math.random() * 0.5),
        size: Math.random() * 6 + 4,
        width: isStrip ? Math.random() * 14 + 10 : Math.random() * 8 + 6,
        height: isStrip ? Math.random() * 6 + 4 : Math.random() * 8 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: isStrip ? 'strip' : Math.random() > 0.5 ? 'rect' : 'circle',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        opacity: 1,
        gravity: 0.35 + Math.random() * 0.15,
        drag: 0.975,
      });
    }

    const startTime = Date.now();
    const duration = 4000; // 4 seconds of confetti flutter

    const render = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics update
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        // Fade out in the last 25% of duration
        if (progress > 0.7) {
          p.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
        }

        if (p.opacity <= 0 || p.y > height + 50) continue;
        aliveCount++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'strip') {
          const wobbleScale = Math.cos(p.wobble);
          ctx.fillRect(-p.width / 2, (-p.height / 2) * wobbleScale, p.width, p.height * Math.abs(wobbleScale));
        } else {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }

        ctx.restore();
      }

      if (progress < 1 && aliveCount > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);
  };

  // Cleanup canvas animations on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      id="launch-overlay-root"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-[18px] overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Full-screen confetti particle canvas for dual party-poppers */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-50 pointer-events-none w-full h-full"
      />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#FF7A00]/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Phase 1: Regular Countdown Card */}
      <AnimatePresence mode="wait">
        {phase === 'timer' && (
          <motion.div
            key="timer-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            id="launch-card"
            className="relative w-full max-w-lg bg-neutral-900/70 border border-white/10 p-8 sm:p-10 rounded-[32px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md text-center space-y-8 overflow-hidden"
          >
            {/* Subtle orange accent outline */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FF7A00] to-transparent" />

            {/* Brand Logo */}
            <div className="flex justify-center" id="launch-logo-container">
              <img
                src="/assets/images/lunch_logo.png"
                alt="In Our Budget"
                className="h-12 sm:h-14 object-contain"
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
        )}

        {/* Phase 2: High-Impact 3 -> 2 -> 1 Large Countdown Sequence */}
        {(phase === 'countdown_3' || phase === 'countdown_2' || phase === 'countdown_1') && (
          <div
            key={`countdown-number-container-${activeNumber}`}
            className="flex flex-col items-center justify-center relative z-20"
          >
            {/* Pulsing ring indicator */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1.4], opacity: [0.6, 0.3, 0] }}
              transition={{ duration: 0.95, ease: 'easeOut' }}
              className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-[#FF7A00] pointer-events-none"
            />

            {/* Number with zoom-in, full scale, and crisp fade */}
            <motion.div
              key={`number-${activeNumber}`}
              initial={{ scale: 0.4, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: [0.4, 1.08, 1], opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 1.35, opacity: 0, filter: 'blur(12px)', transition: { duration: 0.22 } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              <span className="text-8xl sm:text-9xl md:text-[160px] font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-[#FF7A00] drop-shadow-[0_15px_35px_rgba(255,122,0,0.6)]">
                {activeNumber}
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#FF7A00] mt-4 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 animate-spin" /> Get Ready For Launch...
            </motion.p>
          </div>
        )}

        {/* Phase 3: "🎉 We're Live!" Grand Celebratory Reveal */}
        {phase === 'celebrate' && (
          <motion.div
            key="celebration-card"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.4 } }}
            transition={{ type: 'spring', damping: 20, stiffness: 140 }}
            id="launch-celebrate-card"
            className="relative w-full max-w-md bg-neutral-900/90 border border-amber-500/30 p-8 sm:p-10 rounded-[36px] shadow-[0_25px_60px_-10px_rgba(255,122,0,0.4)] backdrop-blur-xl text-center space-y-6 overflow-hidden z-20"
          >
            {/* Top festive gradient border */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#FF7A00] via-amber-400 to-[#FF2D55]" />

            {/* Brand Logo with celebratory glow */}
            <div className="flex justify-center" id="launch-celebrate-logo">
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.08, 1] }}
                transition={{ duration: 0.6 }}
                src="/assets/images/lunch_logo.png"
                alt="In Our Budget"
                className="h-14 sm:h-16 object-contain drop-shadow-[0_8px_20px_rgba(255,122,0,0.35)]"
              />
            </div>

            {/* Celebratory badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00]/40 text-[#FF7A00] text-xs font-black uppercase tracking-wider">
              <PartyPopper className="w-4 h-4 text-amber-400" />
              <span>Launch is Live!</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                🎉 We're Live!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium max-w-xs mx-auto">
                Welcome to In Our Budget! The smart shopping revolution has officially begun.
              </p>
            </div>

            {/* Launch live indicator bar */}
            <div className="pt-2">
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-xs font-bold text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span>Entering Store Experience...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

