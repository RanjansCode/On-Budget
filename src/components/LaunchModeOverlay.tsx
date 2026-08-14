/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  shape: 'rect' | 'circle' | 'strip' | 'star';
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
  '#FFA800', // Golden Amber
  '#FFD700', // Vibrant Gold
  '#FF3366', // Crimson Pink
  '#00E5FF', // Electric Cyan
  '#7C3AED', // Vivid Violet
  '#10B981', // Emerald Green
  '#FFFFFF', // Sparkle White
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
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const { launchDate, launchTime, timezone } = settings;

  // Clear any scheduled timeouts safely
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  // Compute canonical target timestamp
  const getTargetTimestamp = useCallback(() => {
    const cleanTz = (timezone || '+05:30').replace('GMT', '').trim();
    const targetStr = `${launchDate}T${launchTime}:00${cleanTz}`;
    let targetTime = new Date(targetStr).getTime();

    if (isNaN(targetTime)) {
      try {
        const [year, month, day] = launchDate.split('-').map(Number);
        const [hours, minutes] = launchTime.split(':').map(Number);
        targetTime = new Date(year, month - 1, day, hours, minutes).getTime();
      } catch {
        targetTime = NaN;
      }
    }
    return targetTime;
  }, [launchDate, launchTime, timezone]);

  // Dual Party Popper Confetti Particle Spawner (shoots from Left and Right towards Center)
  const firePartyPoppers = useCallback((intensityMultiplier = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const baseCount = window.innerWidth < 640 ? 55 : 90;
    const particleCount = Math.floor(baseCount * intensityMultiplier);

    const newParticles: ConfettiParticle[] = [];

    // Left Popper Cannon (Bottom Left shooting up & right towards center)
    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI / 4 + (Math.random() * 0.45 - 0.22); // ~45 deg towards top-right
      const speed = (Math.random() * 16 + 14) * (0.85 + intensityMultiplier * 0.2);
      const isStrip = Math.random() > 0.4;
      const isStar = Math.random() > 0.85;

      newParticles.push({
        x: Math.random() * 40,
        y: height * 0.9 + Math.random() * 30,
        vx: Math.cos(angle) * speed * (0.85 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.85 + Math.random() * 0.5),
        size: Math.random() * 6 + 4,
        width: isStrip ? Math.random() * 14 + 10 : Math.random() * 8 + 6,
        height: isStrip ? Math.random() * 6 + 4 : Math.random() * 8 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: isStar ? 'star' : isStrip ? 'strip' : Math.random() > 0.5 ? 'rect' : 'circle',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.12 + 0.06,
        opacity: 1,
        gravity: 0.32 + Math.random() * 0.14,
        drag: 0.976,
      });
    }

    // Right Popper Cannon (Bottom Right shooting up & left towards center)
    for (let i = 0; i < particleCount; i++) {
      const angle = (-3 * Math.PI) / 4 + (Math.random() * 0.45 - 0.22); // ~135 deg towards top-left
      const speed = (Math.random() * 16 + 14) * (0.85 + intensityMultiplier * 0.2);
      const isStrip = Math.random() > 0.4;
      const isStar = Math.random() > 0.85;

      newParticles.push({
        x: width - Math.random() * 40,
        y: height * 0.9 + Math.random() * 30,
        vx: Math.cos(angle) * speed * (0.85 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.85 + Math.random() * 0.5),
        size: Math.random() * 6 + 4,
        width: isStrip ? Math.random() * 14 + 10 : Math.random() * 8 + 6,
        height: isStrip ? Math.random() * 6 + 4 : Math.random() * 8 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: isStar ? 'star' : isStrip ? 'strip' : Math.random() > 0.5 ? 'rect' : 'circle',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.12 + 0.06,
        opacity: 1,
        gravity: 0.32 + Math.random() * 0.14,
        drag: 0.976,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];

    if (!animationFrameRef.current) {
      runConfettiLoop();
    }
  }, []);

  // Canvas render loop for continuous physics simulation
  const runConfettiLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || window.innerWidth;
    const height = canvas.height || window.innerHeight;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics step
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        // Slow fade out
        p.opacity -= 0.0035;

        if (p.opacity <= 0 || p.y > height + 60) continue;
        aliveCount++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'strip') {
          const wobbleScale = Math.cos(p.wobble);
          ctx.fillRect(-p.width / 2, (-p.height / 2) * wobbleScale, p.width, p.height * Math.abs(wobbleScale));
        } else if (p.shape === 'star') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }

        ctx.restore();
      }

      // Filter out dead particles
      particlesRef.current = particles.filter((p) => p.opacity > 0 && p.y <= height + 60);

      if (aliveCount > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  // Launch Celebration Sequence: 3 -> 2 -> 1 -> We're Live! -> automatic live switch
  const startLiveLaunchSequence = useCallback(() => {
    clearAllTimeouts();

    // Step 1: Number 3 (for exactly 1 second) + Left & Right Party Poppers
    setPhase('countdown_3');
    setActiveNumber(3);
    firePartyPoppers(1.0);

    // Step 2: Number 2 at 1000ms (for exactly 1 second) + Sustained Flutter
    const t1 = setTimeout(() => {
      setPhase('countdown_2');
      setActiveNumber(2);
      firePartyPoppers(0.8);
    }, 1000);

    // Step 3: Number 1 at 2000ms (for exactly 1 second) + Extra Strong Finale Burst!
    const t2 = setTimeout(() => {
      setPhase('countdown_1');
      setActiveNumber(1);
      firePartyPoppers(1.4); // Stronger celebration for final countdown number
    }, 2000);

    // Step 4: "We're Live! 🎉" Screen at 3000ms (stays for approximately 3 seconds)
    const t3 = setTimeout(() => {
      setActiveNumber(null);
      setPhase('celebrate');

      // Mark launch completion in localStorage to avoid replaying on refresh
      try {
        localStorage.setItem('onbudget_launch_completed', 'true');
        localStorage.setItem(`onbudget_launch_done_${launchDate}_${launchTime}`, 'true');
      } catch {}

      firePartyPoppers(1.2);

      // Step 5: After ~3 seconds of "We're Live!", automatically transition to normal website
      const t4 = setTimeout(() => {
        setPhase('completed');
        onCountdownComplete();
      }, 3000);

      timeoutsRef.current.push(t4);
    }, 3000);

    timeoutsRef.current.push(t1, t2, t3);
  }, [clearAllTimeouts, firePartyPoppers, launchDate, launchTime, onCountdownComplete]);

  // Main countdown timer listener
  useEffect(() => {
    function updateTimer() {
      if (sequenceTriggeredRef.current) return;

      const targetTime = getTargetTimestamp();
      const now = Date.now();
      const totalMs = isNaN(targetTime) ? 0 : targetTime - now;

      // Check if launch was already celebrated or completed previously
      const specificDoneKey = `onbudget_launch_done_${launchDate}_${launchTime}`;
      const isAlreadyCompleted =
        localStorage.getItem('onbudget_launch_completed') === 'true' ||
        localStorage.getItem(specificDoneKey) === 'true';

      if (isNaN(targetTime) || totalMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

        // If user is refreshing after launch completion or opened page after expiry (> 4 seconds past)
        if (isAlreadyCompleted || totalMs < -4000) {
          onCountdownComplete();
          return;
        }

        // Trigger sequence exactly once
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
    const interval = setInterval(updateTimer, 500); // 500ms for tight synchronization

    return () => {
      clearInterval(interval);
      clearAllTimeouts();
    };
  }, [getTargetTimestamp, launchDate, launchTime, onCountdownComplete, clearAllTimeouts, startLiveLaunchSequence]);

  // Cleanup canvas & animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // REQUIREMENT 1: ADMIN VISIBILITY RULE
  // If remaining time > 10 seconds and user is Admin, overlay is hidden so Admin can manage site/settings.
  // When remaining time <= 10 seconds (totalMs <= 10000), Admin sees the exact same Launching Soon countdown screen.
  if (isAdmin && countdown.totalMs > 10000 && phase === 'timer') {
    return null;
  }

  // If completed, return null
  if (phase === 'completed') {
    return null;
  }

  return (
    <div
      id="launch-overlay-root"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-[18px] overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Full-screen dual party-popper confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-50 pointer-events-none w-full h-full"
      />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#FF7A00]/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Left & Right Visual Party Poppers during 3-2-1 and We're Live celebration */}
      {(phase === 'countdown_3' || phase === 'countdown_2' || phase === 'countdown_1' || phase === 'celebrate') && (
        <>
          {/* Left Party Popper Visual Icon & Glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: 15 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1, rotate: [15, 35, 30] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed bottom-6 left-6 z-40 pointer-events-none flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-[#FF7A00]/30 rounded-full blur-lg animate-pulse" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900/90 border border-amber-500/40 flex items-center justify-center shadow-2xl backdrop-blur-md">
                <PartyPopper className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400 stroke-[2.2]" />
              </div>
            </div>
          </motion.div>

          {/* Right Party Popper Visual Icon & Glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1, rotate: [-15, -35, -30] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-40 pointer-events-none flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-[#FF3366]/30 rounded-full blur-lg animate-pulse" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900/90 border border-pink-500/40 flex items-center justify-center shadow-2xl backdrop-blur-md">
                <PartyPopper className="w-8 h-8 sm:w-9 sm:h-9 text-pink-400 stroke-[2.2] scale-x-[-1]" />
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Premium Dynamic Mesh Gradient & Film Grain for 3-2-1 Countdown & Celebration */}
      <AnimatePresence>
        {(phase === 'countdown_3' || phase === 'countdown_2' || phase === 'countdown_1' || phase === 'celebrate') && (
          <motion.div
            key="launch-mesh-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 pointer-events-none overflow-hidden z-10"
          >
            {/* Mesh Gradient Fluid Light Orbs */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1.05],
                x: [0, 35, -25, 0],
                y: [0, -25, 20, 0],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#FF7A00]/30 via-amber-400/20 to-transparent rounded-full blur-[140px]"
            />
            <motion.div
              animate={{
                scale: [1.1, 0.95, 1.15],
                x: [0, -40, 30, 0],
                y: [0, 35, -20, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1/3 right-1/3 translate-x-1/2 translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-bl from-[#FF2D55]/25 via-purple-600/15 to-transparent rounded-full blur-[150px]"
            />
            <motion.div
              animate={{
                scale: [0.9, 1.2, 1],
                opacity: [0.2, 0.35, 0.2],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-400/20 rounded-full blur-[130px]"
            />

            {/* Depth Vignette & Radial Focus */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_60%,rgba(0,0,0,0.92)_100%)]" />

            {/* Procedural Film Grain Overlay */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.24] mix-blend-overlay pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <filter id="launch-grain-filter">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.85"
                  numOctaves="3"
                  stitchTiles="stitch"
                />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#launch-grain-filter)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

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
              animate={{ scale: [0.8, 1.25, 1.5], opacity: [0.7, 0.35, 0] }}
              transition={{ duration: 0.95, ease: 'easeOut' }}
              className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-2 border-[#FF7A00] pointer-events-none"
            />

            {/* Number with zoom-in, full scale, and crisp fade */}
            <motion.div
              key={`number-${activeNumber}`}
              initial={{ scale: 0.35, opacity: 0, filter: 'blur(12px)' }}
              animate={{ scale: [0.35, 1.1, 1], opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 1.35, opacity: 0, filter: 'blur(14px)', transition: { duration: 0.2 } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              <span className="text-8xl sm:text-9xl md:text-[160px] font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-[#FF7A00] drop-shadow-[0_15px_35px_rgba(255,122,0,0.65)]">
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

        {/* Phase 3: "We're Live! 🎉" Grand Celebratory Reveal */}
        {phase === 'celebrate' && (
          <motion.div
            key="celebration-card"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.35 } }}
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

            {/* Main Headline & Support text */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                We're Live! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium max-w-xs mx-auto">
                Thank you for your support! Welcome to In Our Budget.
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
