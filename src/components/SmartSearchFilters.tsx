/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Filter,
  SlidersHorizontal,
  X,
  Check,
  Tag,
  Star,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Percent,
  CheckCircle2,
  Eye,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Category, Product } from '../types';

export interface SmartFilterState {
  category: string;
  brand: string;
  marketplace: string;
  priceRange: number | null; // Max price or price threshold
  minDiscount: number; // e.g. 0, 10, 20, 30, 50
  minRating: number; // e.g. 0, 4, 4.5
  badge: 'all' | 'tested' | 'recommended' | 'trending' | 'reel';
}

export type SortOption = 'newest' | 'low-price' | 'high-price' | 'discount' | 'rating' | 'popular' | 'trending';

interface SmartSearchFiltersProps {
  categories: Category[];
  products: Product[];
  filterState: SmartFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<SmartFilterState>>;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  totalFilteredCount: number;
  onClearAll: () => void;
}

export default function SmartSearchFilters({
  categories,
  products,
  filterState,
  setFilterState,
  sortOption,
  setSortOption,
  totalFilteredCount,
  onClearAll,
}: SmartSearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  // Extract unique brands from published products
  const availableBrands = React.useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach(p => {
      if (p.brand && p.brand.trim()) {
        brandsSet.add(p.brand.trim());
      }
    });
    return Array.from(brandsSet).sort();
  }, [products]);

  // Marketplace platforms
  const marketplaces = ['Amazon', 'Flipkart', 'Meesho', 'Croma', 'Myntra'];

  // Price brackets
  const priceBuckets = [
    { label: 'Under ₹200', value: 200 },
    { label: 'Under ₹500', value: 500 },
    { label: 'Under ₹1,000', value: 1000 },
    { label: 'Under ₹2,000', value: 2000 },
  ];

  // Active filter count
  const activeFilterCount =
    (filterState.category ? 1 : 0) +
    (filterState.brand ? 1 : 0) +
    (filterState.marketplace ? 1 : 0) +
    (filterState.priceRange !== null ? 1 : 0) +
    (filterState.minDiscount > 0 ? 1 : 0) +
    (filterState.minRating > 0 ? 1 : 0) +
    (filterState.badge !== 'all' ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-xs p-3 sm:p-4 space-y-3 transition-colors">
      
      {/* Top Filter Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF5A00]/10 text-[#FF5A00] flex items-center justify-center font-bold shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display">
                Smart Filters &amp; Sorting
              </h2>
              {activeFilterCount > 0 && (
                <span className="text-xs bg-[#FF5A00] text-white font-bold px-2 py-0.5 rounded-full leading-none">
                  {activeFilterCount} active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Clear All Button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-bold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Toggle Expand/Collapse Filters Button */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>{expanded ? 'Fewer Filters' : 'All Smart Filters'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* QUICK BADGE & SORT CHIPS (ALWAYS VISIBLE) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1.5 sm:pt-1 border-t border-slate-100 dark:border-slate-800/80">
        
        {/* Badges / Curated Filters */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-0.5 sm:mr-1 font-display">
            Curated:
          </span>
          <button
            type="button"
            onClick={() => setFilterState(prev => ({ ...prev, badge: 'all' }))}
            className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              filterState.badge === 'all'
                ? 'bg-[#FF5A00] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => setFilterState(prev => ({ ...prev, badge: filterState.badge === 'tested' ? 'all' : 'tested' }))}
            className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              filterState.badge === 'tested'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Tested &amp; Verified
          </button>
          <button
            type="button"
            onClick={() => setFilterState(prev => ({ ...prev, badge: filterState.badge === 'recommended' ? 'all' : 'recommended' }))}
            className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              filterState.badge === 'recommended'
                ? 'bg-[#FF5A00] text-white shadow-xs'
                : 'bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/20 hover:bg-[#FF5A00]/20'
            }`}
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Curated Pick
          </button>
          <button
            type="button"
            onClick={() => setFilterState(prev => ({ ...prev, badge: filterState.badge === 'trending' ? 'all' : 'trending' }))}
            className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              filterState.badge === 'trending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Trending / Viral
          </button>
        </div>

        {/* Sort Selector Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display shrink-0">
            Sort By:
          </span>
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as SortOption)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF5A00] cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="trending">Trending &amp; Viral</option>
            <option value="newest">Newest Arrivals</option>
            <option value="low-price">Price: Low to High</option>
            <option value="high-price">Price: High to Low</option>
            <option value="discount">Highest Discount %</option>
            <option value="rating">Best Rated (4.5+ ★)</option>
          </select>
        </div>
      </div>

      {/* EXPANDABLE SMART FILTER PANEL */}
      {expanded && (
        <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
          
          {/* 1. Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block">
              Category
            </label>
            <select
              value={filterState.category}
              onChange={e => setFilterState(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Brand Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block">
              Brand
            </label>
            <select
              value={filterState.brand}
              onChange={e => setFilterState(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
            >
              <option value="">All Brands</option>
              {availableBrands.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Marketplace Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block">
              Marketplace Store
            </label>
            <select
              value={filterState.marketplace}
              onChange={e => setFilterState(prev => ({ ...prev, marketplace: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
            >
              <option value="">All Marketplaces (Amazon, Flipkart, Meesho...)</option>
              {marketplaces.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Maximum Price Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block">
              Budget / Max Price
            </label>
            <select
              value={filterState.priceRange !== null ? filterState.priceRange : ''}
              onChange={e => setFilterState(prev => ({ ...prev, priceRange: e.target.value ? Number(e.target.value) : null }))}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
            >
              <option value="">Any Budget</option>
              {priceBuckets.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Discount Threshold */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block">
              Minimum Discount
            </label>
            <div className="flex gap-1.5">
              {[0, 10, 20, 30, 50].map(disc => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => setFilterState(prev => ({ ...prev, minDiscount: disc }))}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    filterState.minDiscount === disc
                      ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {disc === 0 ? 'Any' : `${disc}%+`}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Rating Threshold */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block">
              Minimum Rating
            </label>
            <div className="flex gap-1.5">
              {[0, 4.0, 4.5].map(rat => (
                <button
                  key={rat}
                  type="button"
                  onClick={() => setFilterState(prev => ({ ...prev, minRating: rat }))}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    filterState.minRating === rat
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span>{rat === 0 ? 'Any' : `${rat}+`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
