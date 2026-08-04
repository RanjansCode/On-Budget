import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe, Check, Sparkles, X } from 'lucide-react';
import { SUPPORTED_CURRENCIES, detectUserCurrency, setUserCurrency, CurrencyInfo, formatCurrencyPrice } from '../utils/currency';

interface CurrencySwitcherProps {
  currentCurrency: string;
  onCurrencyChange: (code: string) => void;
  compact?: boolean;
}

export default function CurrencySwitcher({ currentCurrency, onCurrencyChange, compact = false }: CurrencySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeCurrency = SUPPORTED_CURRENCIES[currentCurrency] || SUPPORTED_CURRENCIES.INR;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setUserCurrency(code);
    onCurrencyChange(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 sm:gap-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shadow-2xs font-semibold ${
          compact ? 'px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px]' : 'px-2 sm:px-2.5 py-1.5 text-xs'
        }`}
        title="Change Currency"
      >
        <span className="text-xs sm:text-sm leading-none shrink-0">{activeCurrency.flag}</span>
        <span className="font-bold">{activeCurrency.code}</span>
        <span className="text-slate-400 dark:text-slate-400 font-mono text-[10px] hidden sm:inline">({activeCurrency.symbol})</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Select Currency</span>
            <Globe className="w-3 h-3 text-[#FF5A00]" />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 py-1">
            {Object.values(SUPPORTED_CURRENCIES).map((curr) => {
              const isSelected = curr.code === activeCurrency.code;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleSelect(curr.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF5A00]/10 text-[#FF5A00] font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{curr.flag}</span>
                    <div className="flex flex-col text-left leading-tight">
                      <span>{curr.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        1 INR = {curr.rateFromINR} {curr.code}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Top banner that notifies international visitors of auto-detected currency
 */
export function LocationCurrencyBanner({
  currentCurrency,
  onCurrencyChange,
}: {
  currentCurrency: string;
  onCurrencyChange: (code: string) => void;
}) {
  const [bannerInfo, setBannerInfo] = useState<{ visible: boolean; currency: CurrencyInfo; detectedBy: string } | null>(null);

  useEffect(() => {
    // Only show banner if user hasn't explicitly dismissed it or chosen preference
    const dismissed = sessionStorage.getItem('onbudget_location_banner_dismissed');
    if (dismissed) return;

    const detected = detectUserCurrency();
    if (detected.isInternational) {
      setBannerInfo({
        visible: true,
        currency: detected.currency,
        detectedBy: detected.detectedBy,
      });
    }
  }, []);

  if (!bannerInfo || !bannerInfo.visible) return null;

  const dismiss = () => {
    sessionStorage.setItem('onbudget_location_banner_dismissed', 'true');
    setBannerInfo(null);
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 text-slate-800 dark:text-slate-200 px-4 py-2 text-xs flex items-center justify-between gap-3 backdrop-blur-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm shrink-0">{bannerInfo.currency.flag}</span>
        <p className="truncate">
          <span className="font-bold text-amber-600 dark:text-amber-400">International Visitor Detected:</span>{' '}
          Showing prices converted to <strong className="text-slate-900 dark:text-white font-mono">{bannerInfo.currency.code} ({bannerInfo.currency.symbol})</strong> based on your location/browser locale.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setUserCurrency('INR');
            onCurrencyChange('INR');
            dismiss();
          }}
          className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
        >
          Reset to INR (₹)
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
