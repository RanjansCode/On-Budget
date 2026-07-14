import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Star, CheckCircle2 } from 'lucide-react';
import { Category } from '../types';

interface HeroProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPriceRange: number | null;
  setSelectedPriceRange: (price: number | null) => void;
  totalProducts: number;
}

export default function Hero({
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedPriceRange,
  setSelectedPriceRange,
  totalProducts,
}: HeroProps) {
  const priceBuckets = [
    { label: 'Best Under ₹99', val: 99 },
    { label: 'Best Under ₹199', val: 199 },
    { label: 'Best Under ₹299', val: 299 },
    { label: 'Best Under ₹499', val: 499 },
    { label: 'Best Under ₹999', val: 999 },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 sm:p-12 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8 bg-gradient-to-tr from-white via-white to-[#FF5A00]/5 dark:from-slate-900 dark:via-slate-900 dark:to-[#FF5A00]/5 transition-colors duration-300 shadow-xs">
        <div className="space-y-5 max-w-2xl text-left">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 bg-[#FF5A00]/10 border border-[#FF5A00]/20 text-[#FF5A00] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-display"
          >
            <Sparkles className="w-3.5 h-3.5" />
            100% Ad-Free, No Sponsored Affiliate Traps
          </motion.div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight font-display">
            Curated Gadgets. <br className="hidden sm:block" />
            Personally Tested. <br />
            <span className="text-[#FF5A00] bg-[#FF5A00]/10 border border-[#FF5A00]/20 px-3.5 py-0.5 rounded-2xl inline-block mt-1">Strictly On Budget.</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-sans">
            Discover viral workspace setups, hidden pocket lights, and smart home upgrades featured in creator reels. Every item is handpicked, unboxed, and tested with links that guarantee the lowest price.
          </p>

          <div className="flex flex-wrap gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-950 px-3 py-1.5 border border-slate-200/50 dark:border-slate-850 rounded-full font-display">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
              Personally Tested Badging
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-950 px-3 py-1.5 border border-slate-200/50 dark:border-slate-850 rounded-full font-display">
              <Star className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
              Creator Detailed Logs
            </div>
          </div>
        </div>

        {/* Dynamic Highlight Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-sm p-6 bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 rounded-3xl relative overflow-hidden shrink-0 group hover:border-[#FF5A00]/30 transition-all shadow-xs text-left"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF5A00]/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] bg-red-500/10 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/35 uppercase font-display">
            Viral Highlight
          </span>
          <h3 className="text-sm font-extrabold text-slate-950 dark:text-white mt-3 group-hover:text-[#FF5A00] transition-colors font-display">Astronaut Galaxy Projector</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
            VIRAL HIT! Turn any plain bedroom into a celestial galaxy. 360-degree rotating helmet, multiple star combinations, and sleep timer.
          </p>

          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-lg font-black text-[#FF5A00]">₹949</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 line-through">₹2,499</span>
            <span className="text-[10px] font-bold text-red-500 font-mono">62% OFF</span>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Pricing Budget Selector */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-display text-left">Browse by Price Bracket</h3>
          {selectedPriceRange !== null && (
            <button
              onClick={() => setSelectedPriceRange(null)}
              className="text-[11px] font-bold text-[#FF5A00] hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {priceBuckets.map(b => (
            <button
              key={b.val}
              onClick={() => setSelectedPriceRange(selectedPriceRange === b.val ? null : b.val)}
              className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-3xs ${
                selectedPriceRange === b.val
                  ? 'bg-[#FF5A00]/10 border-[#FF5A00] text-[#FF5A00] scale-98 font-black'
                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-black font-display">Under ₹{b.val}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1">Direct curations</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Slider / Selector */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-display text-left">Popular Categories</h3>
          {selectedCategory !== '' && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-[11px] font-bold text-[#FF5A00] hover:underline cursor-pointer"
            >
              All Categories
            </button>
          )}
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4.5 py-2.5 rounded-xl border text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCategory === ''
                ? 'bg-[#FF5A00]/10 border-[#FF5A00] text-[#FF5A00]'
                : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Products ({totalProducts})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4.5 py-2.5 rounded-xl border text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === c.id
                  ? 'bg-[#FF5A00]/10 border-[#FF5A00] text-[#FF5A00]'
                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
