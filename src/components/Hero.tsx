import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Category } from '../types';
import { formatCurrencyPrice, detectUserCurrency } from '../utils/currency';

interface HeroProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPriceRange: number | null;
  setSelectedPriceRange: (price: number | null) => void;
  totalProducts: number;
  currentCurrency?: string;
}

function Hero({
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedPriceRange,
  setSelectedPriceRange,
  totalProducts,
  currentCurrency: propCurrency,
}: HeroProps) {
  const [activeCurrencyCode, setActiveCurrencyCode] = useState(propCurrency || 'INR');
  const [isMobilePriceOpen, setIsMobilePriceOpen] = useState(false);

  useEffect(() => {
    if (propCurrency) {
      setActiveCurrencyCode(propCurrency);
    } else {
      setActiveCurrencyCode(detectUserCurrency().currency.code);
    }

    const handleCurrencyChange = (e: any) => {
      setActiveCurrencyCode(e.detail);
    };
    window.addEventListener('onbudget_currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('onbudget_currency_changed', handleCurrencyChange);
  }, [propCurrency]);

  const priceBuckets = [
    { val: 99 },
    { val: 199 },
    { val: 299 },
    { val: 499 },
    { val: 999 },
  ];

  return (
    <div className="space-y-8">
      {/* Primary Accessible H1 Title for Technical SEO & Heading Hierarchy */}
      <div className="space-y-2 text-left">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white font-display tracking-tight">
          In Our Budget <span className="text-[#FF5A00]">— Curated Gadgets & Budget Essentials</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
          Personally tested, strictly reviewed gadgets, desk accessories, and study gear for students and setup enthusiasts.
        </p>
      </div>

      {/* Dynamic Pricing Budget Selector */}
      <div className="space-y-3">
        {/* Desktop View (md and above) */}
        <div className="hidden md:block space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest font-display text-left">
              Browse by Price Bracket
            </h2>
            {selectedPriceRange !== null && (
              <button
                onClick={() => setSelectedPriceRange(null)}
                className="text-[11px] font-bold text-[#FF5A00] hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-3">
            {priceBuckets.map(b => {
              const formatted = formatCurrencyPrice(b.val, activeCurrencyCode);
              return (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => setSelectedPriceRange(selectedPriceRange === b.val ? null : b.val)}
                  aria-pressed={selectedPriceRange === b.val}
                  className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-3xs ${
                    selectedPriceRange === b.val
                      ? 'bg-[#FF5A00]/10 border-[#FF5A00] text-[#FF5A00] scale-98 font-black'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black font-display">Under {formatted.formatted}</span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                    {activeCurrencyCode === 'INR' ? 'Direct curations' : `Base: ₹${b.val}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile View (below md) */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsMobilePriceOpen(!isMobilePriceOpen)}
              className="flex-1 flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 font-bold text-xs tracking-wide shadow-3xs transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99]"
              aria-expanded={isMobilePriceOpen}
              aria-controls="mobile-price-bracket-panel"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-display truncate">
                  Browse by Price Bracket
                </span>
                {selectedPriceRange !== null && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/20 shrink-0">
                    Under {formatCurrencyPrice(selectedPriceRange, activeCurrencyCode).formatted}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                  isMobilePriceOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {selectedPriceRange !== null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPriceRange(null);
                  setIsMobilePriceOpen(false);
                }}
                className="px-3 py-3 text-[11px] font-bold text-[#FF5A00] hover:bg-[#FF5A00]/10 rounded-2xl transition-colors cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Collapsible Panel */}
          {isMobilePriceOpen && (
            <div
              id="mobile-price-bracket-panel"
              className="mt-2.5 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-1.5 transition-all duration-200 animate-in fade-in slide-in-from-top-2"
            >
              <div className="grid grid-cols-1 gap-1.5">
                {priceBuckets.map(b => {
                  const formatted = formatCurrencyPrice(b.val, activeCurrencyCode);
                  const isSelected = selectedPriceRange === b.val;
                  return (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => {
                        setSelectedPriceRange(isSelected ? null : b.val);
                        setIsMobilePriceOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF5A00]/10 border-[#FF5A00] text-[#FF5A00] font-black'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold font-display">Under {formatted.formatted}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        {activeCurrencyCode === 'INR' ? 'Direct curations' : `Base: ₹${b.val}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Hero);
