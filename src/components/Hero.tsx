import React from 'react';
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
