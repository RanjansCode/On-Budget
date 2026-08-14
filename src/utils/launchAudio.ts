/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// AudioContext singleton for realistic party-popper & celebration sound effects
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Autoplay may prevent resume until user interacts; handled gracefully
      });
    }

    return audioCtx;
  } catch {
    return null;
  }
}

// Automatically unlock audio context on first user touch/click
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {}
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
}

/**
 * Synthesizes a realistic party-popper confetti burst sound effect:
 * - High-speed pneumatic acoustic snap (rapid downward pitch envelope)
 * - Pressurized air rush & confetti flutter (filtered burst noise)
 * - Low-end resonant canister pop thump
 * - True stereo panning matching the left & right poppers
 */
function createPopperBurst(
  ctx: AudioContext,
  time: number,
  pan: number,
  volume: number,
  pitchMultiplier: number = 1
) {
  // 1. High-frequency pneumatic snap (Transient Crack)
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(1400 * pitchMultiplier, time);
  snapOsc.frequency.exponentialRampToValueAtTime(110, time + 0.045);

  snapGain.gain.setValueAtTime(0.7 * volume, time);
  snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

  snapOsc.connect(snapGain);

  // 2. Air burst / Confetti rush noise
  const bufferSize = Math.floor(ctx.sampleRate * 0.28);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(1800 * pitchMultiplier, time);
  bandpass.frequency.exponentialRampToValueAtTime(450, time + 0.22);
  bandpass.Q.setValueAtTime(2.2, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.85 * volume, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

  noiseSource.connect(bandpass);
  bandpass.connect(noiseGain);

  // 3. Low-end canister body punch (Thump)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(160 * pitchMultiplier, time);
  subOsc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

  subGain.gain.setValueAtTime(0.65 * volume, time);
  subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

  subOsc.connect(subGain);

  // Stereo Panning
  let panner: StereoPannerNode | GainNode;
  if (ctx.createStereoPanner) {
    const stereoPanner = ctx.createStereoPanner();
    stereoPanner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), time);
    panner = stereoPanner;
  } else {
    panner = ctx.createGain();
  }

  snapGain.connect(panner);
  noiseGain.connect(panner);
  subGain.connect(panner);
  panner.connect(ctx.destination);

  // Start sounds
  snapOsc.start(time);
  snapOsc.stop(time + 0.06);

  noiseSource.start(time);
  noiseSource.stop(time + 0.28);

  subOsc.start(time);
  subOsc.stop(time + 0.1);
}

/**
 * Plays sparkling celebratory tones layered under the grand launch reveal
 */
function playCelebratoryChime(ctx: AudioContext, time: number, volume: number) {
  const chordNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major triad)

  chordNotes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time + idx * 0.045);

    gain.gain.setValueAtTime(0, time + idx * 0.045);
    gain.gain.linearRampToValueAtTime(0.18 * volume, time + idx * 0.045 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + idx * 0.045 + 0.95);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time + idx * 0.045);
    osc.stop(time + idx * 0.045 + 1.0);
  });
}

/**
 * Main sound trigger function synchronized with celebration phases:
 * - 'normal': Crisp left & right dual-party popper burst (for 3 and 2)
 * - 'strong': Punchy high-impact party popper burst (for 1)
 * - 'grand': Double popper cannons + sparkling triumphant chime (for We're Live!)
 */
export function playLaunchCelebrationSound(type: 'normal' | 'strong' | 'grand' = 'normal') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'normal') {
      // Dual popper pop: Left (-0.75) and Right (+0.75) with 12ms micro-delay
      createPopperBurst(ctx, now, -0.75, 0.75, 1.0);
      createPopperBurst(ctx, now + 0.014, 0.75, 0.75, 1.08);
    } else if (type === 'strong') {
      // Stronger popper pop for final countdown "1"
      createPopperBurst(ctx, now, -0.85, 0.95, 0.96);
      createPopperBurst(ctx, now + 0.012, 0.85, 0.95, 1.12);
      createPopperBurst(ctx, now + 0.024, 0.0, 0.7, 1.0); // Center punch
    } else if (type === 'grand') {
      // Grand celebration for "We're Live! 🎉"
      createPopperBurst(ctx, now, -0.9, 1.0, 0.94);
      createPopperBurst(ctx, now + 0.016, 0.9, 1.0, 1.15);
      createPopperBurst(ctx, now + 0.032, -0.3, 0.8, 1.05);
      createPopperBurst(ctx, now + 0.048, 0.3, 0.8, 1.2);
      playCelebratoryChime(ctx, now + 0.05, 0.85);
    }
  } catch (err) {
    // Autoplay or audio permission restrictions handled gracefully without blocking UI
    console.debug('Launch audio playback skipped or not permitted by browser:', err);
  }
}
