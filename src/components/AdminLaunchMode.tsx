/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Clock, AlertTriangle, ShieldCheck, RefreshCw, Eye } from 'lucide-react';
import { LaunchSettings } from '../firebase/firestore';

interface AdminLaunchModeProps {
  launchSettings: LaunchSettings;
  onSaveLaunchSettings: (settings: LaunchSettings) => Promise<void>;
}

const TIMEZONES = [
  { value: '+05:30', label: 'UTC+05:30 (Indian Standard Time - IST)' },
  { value: '+00:00', label: 'UTC+00:00 (Coordinated Universal Time - UTC)' },
  { value: '-05:00', label: 'UTC-05:00 (Eastern Standard Time - EST)' },
  { value: '-08:00', label: 'UTC-08:00 (Pacific Standard Time - PST)' },
  { value: '+01:00', label: 'UTC+01:00 (Central European Time - CET)' },
  { value: '+08:00', label: 'UTC+08:00 (Singapore Standard Time - SGT)' },
  { value: '+09:00', label: 'UTC+09:00 (Japan Standard Time - JST)' },
  { value: '+10:00', label: 'UTC+10:00 (Australian Eastern Time - AEST)' },
];

export default function AdminLaunchMode({
  launchSettings,
  onSaveLaunchSettings,
}: AdminLaunchModeProps) {
  const [enabled, setEnabled] = useState(launchSettings.enabled);
  const [launchDate, setLaunchDate] = useState(launchSettings.launchDate || '2026-08-01');
  const [launchTime, setLaunchTime] = useState(launchSettings.launchTime || '12:00');
  const [timezone, setTimezone] = useState(launchSettings.timezone || '+05:30');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if prop changes (real-time updates)
  useEffect(() => {
    setEnabled(launchSettings.enabled);
    if (launchSettings.launchDate) setLaunchDate(launchSettings.launchDate);
    if (launchSettings.launchTime) setLaunchTime(launchSettings.launchTime);
    if (launchSettings.timezone) setTimezone(launchSettings.timezone);
  }, [launchSettings]);

  // Timer states for preview countdown
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

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
  }, [launchDate, launchTime, timezone]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onSaveLaunchSettings({
        id: 'launch',
        enabled,
        launchDate,
        launchTime,
        timezone,
        updatedAt: new Date().toISOString(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save launch settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Settings Form Card */}
      <div id="launch-settings-form-container" className="lg:col-span-7 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-6">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF7A00]" /> Launch Control & Timeline
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Configure when the platform goes live. When active, visitors will see the countdown landing card.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Main Toggle Switch */}
          <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Launch Mode Overlay</span>
              <span className="text-[10px] text-neutral-500 block">
                {enabled ? 'Active: Site blurred & locked under premium splash' : 'Inactive: Normal public operations'}
              </span>
            </div>
            <button
              type="button"
              id="launch-mode-toggle-button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-[#FF7A00]' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Launch Date *
              </label>
              <input
                type="date"
                required
                value={launchDate}
                onChange={(e) => setLaunchDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF7A00] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Launch Time *
              </label>
              <input
                type="time"
                required
                value={launchTime}
                onChange={(e) => setLaunchTime(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF7A00] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Launch Time Zone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF7A00] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Form action button */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {enabled && countdown.totalMs === 0 && (
                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-1 rounded">
                  <AlertTriangle className="w-3 h-3" /> Note: Countdown is zero. Saving will disable Launch Mode.
                </div>
              )}
              {!enabled && (
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" /> Authorized Admin Safe Area
                </span>
              )}
            </div>

            <button
              type="submit"
              id="launch-settings-save-button"
              disabled={isSaving}
              className={`flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#FF7A00] hover:bg-[#E06C00] text-white active:scale-95 disabled:opacity-50'
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <>Saved Successfully!</>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Timeline
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview / Diagnostic Card */}
      <div id="launch-settings-preview-container" className="lg:col-span-5 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-neutral-400" /> Live Preview
          </h4>
          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
              enabled
                ? 'bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/25'
                : 'bg-neutral-850 text-neutral-500 border border-neutral-800'
            }`}
          >
            {enabled ? 'Active Splash' : 'Idle / Off'}
          </span>
        </div>

        {/* Outer Frame preview */}
        <div className="border border-neutral-850 rounded-xl bg-neutral-950 p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] text-center">
          {/* Mock blurred background */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-black pointer-events-none" />

          {/* Core Launch Card mock */}
          <div className="relative z-10 w-full max-w-sm space-y-4">
            {/* Mock Logo */}
            <div className="flex justify-center">
              <img
                src="/logo_inourbudget.png"
                alt="In Our Budget"
                className="h-9 object-contain"
                onError={(e) => {
                  // Fallback in preview if image fails
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=100';
                }}
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-extrabold text-white tracking-tight">We're Launching Soon 🚀</h2>
              <p className="text-[10px] text-neutral-400">Our platform is almost ready. Stay tuned.</p>
            </div>

            {/* Countdown timer mockup */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl">
              <p className="text-[9px] uppercase tracking-widest font-black text-[#FF7A00] mb-2">Launch In</p>
              <div className="grid grid-cols-4 gap-1">
                <div className="p-1 bg-neutral-950 rounded border border-neutral-850">
                  <span className="block text-sm font-black text-white font-mono">
                    {String(countdown.days).padStart(2, '0')}
                  </span>
                  <span className="block text-[8px] text-neutral-500 uppercase font-bold">Days</span>
                </div>
                <div className="p-1 bg-neutral-950 rounded border border-neutral-850">
                  <span className="block text-sm font-black text-white font-mono">
                    {String(countdown.hours).padStart(2, '0')}
                  </span>
                  <span className="block text-[8px] text-neutral-500 uppercase font-bold">Hrs</span>
                </div>
                <div className="p-1 bg-neutral-950 rounded border border-neutral-850">
                  <span className="block text-sm font-black text-white font-mono">
                    {String(countdown.minutes).padStart(2, '0')}
                  </span>
                  <span className="block text-[8px] text-neutral-500 uppercase font-bold">Min</span>
                </div>
                <div className="p-1 bg-neutral-950 rounded border border-neutral-850">
                  <span className="block text-sm font-black text-[#FF7A00] font-mono animate-pulse">
                    {String(countdown.seconds).padStart(2, '0')}
                  </span>
                  <span className="block text-[8px] text-neutral-500 uppercase font-bold">Sec</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-neutral-500">
              Target: {launchDate} at {launchTime} ({timezone})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
