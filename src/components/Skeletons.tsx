import React from 'react';
import ImageSkeleton from './ImageSkeleton';

export { ImageSkeleton };

/**
 * Single Product Card Skeleton - Exactly mirrors ProductCard layout & dimensions
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs relative h-full min-w-0">
      {/* Top Wishlist Icon Skeleton */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl skeleton-shimmer" />

      {/* Circular Discount Badge Skeleton */}
      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full skeleton-shimmer" />

      {/* Main Image Area Skeleton */}
      <div className="relative w-full h-[155px] xs:h-[175px] sm:h-[220px] md:h-[240px] lg:h-[260px] skeleton-shimmer shrink-0 border-b border-slate-200/40 dark:border-slate-800/60 flex items-center justify-center p-2.5 sm:p-4">
        {/* Bottom Badges Skeleton */}
        <div className="absolute bottom-1.5 left-1.5 right-2 flex gap-1 z-10">
          <div className="w-10 sm:w-12 h-3.5 sm:h-4 rounded-md skeleton-shimmer" />
          <div className="w-12 sm:w-16 h-3.5 sm:h-4 rounded-md skeleton-shimmer" />
        </div>
      </div>

      {/* Product Info Body Skeleton */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 min-w-0">
        <div className="space-y-1.5 sm:space-y-2 min-w-0">
          {/* Brand Skeleton */}
          <div className="w-16 sm:w-20 h-2.5 sm:h-3 rounded skeleton-shimmer" />
          {/* Title Skeleton */}
          <div className="w-4/5 h-3.5 sm:h-4 rounded-md skeleton-shimmer" />
          {/* Description Skeleton (2 lines) */}
          <div className="w-full h-2.5 sm:h-3 rounded skeleton-shimmer" />
          <div className="w-2/3 h-2.5 sm:h-3 rounded skeleton-shimmer" />
        </div>

        {/* Pricing Row & Details Button Skeleton */}
        <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-auto min-w-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-14 sm:w-16 h-4 sm:h-5 rounded-md skeleton-shimmer" />
              <div className="w-8 sm:w-10 h-2.5 sm:h-3 rounded skeleton-shimmer" />
            </div>
            <div className="w-10 sm:w-12 h-2 sm:h-2.5 rounded skeleton-shimmer" />
          </div>
          {/* Review Details Button Skeleton */}
          <div className="w-full sm:w-24 h-7 sm:h-8 rounded-lg sm:rounded-xl skeleton-shimmer shrink-0" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product Grid Skeleton - Renders 8-12 skeleton cards in a responsive grid
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * Single Review Item Skeleton
 */
export function ReviewSkeleton() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Avatar Skeleton */}
          <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
          <div className="space-y-1">
            <div className="w-28 h-3.5 rounded skeleton-shimmer" />
            <div className="w-16 h-2.5 rounded skeleton-shimmer" />
          </div>
        </div>
        {/* Rating Stars Skeleton */}
        <div className="w-20 h-4 rounded-md skeleton-shimmer" />
      </div>
      {/* Review Content lines */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full h-3 rounded skeleton-shimmer" />
        <div className="w-5/6 h-3 rounded skeleton-shimmer" />
        <div className="w-2/3 h-3 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

/**
 * Product Details Page Skeleton - Mirrors ProductDetail component layout
 */
export function ProductDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Back button & Breadcrumb Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-24 h-9 rounded-xl skeleton-shimmer" />
        <div className="w-32 h-4 rounded skeleton-shimmer" />
      </div>

      {/* Main Product Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery Skeleton (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Large Main Image Box */}
          <div className="w-full h-[360px] sm:h-[420px] rounded-2xl skeleton-shimmer relative overflow-hidden" />
          
          {/* Thumbnail Strip */}
          <div className="grid grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="w-full h-20 rounded-xl skeleton-shimmer" />
            ))}
          </div>

          {/* Social Proof Reel Skeleton */}
          <div className="w-full h-28 rounded-2xl skeleton-shimmer" />
        </div>

        {/* Right Column: Details & Purchase Options (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Category & Title */}
          <div className="space-y-2">
            <div className="w-24 h-3.5 rounded skeleton-shimmer" />
            <div className="w-3/4 h-7 rounded-lg skeleton-shimmer" />
            <div className="flex items-center gap-2 pt-1">
              <div className="w-24 h-5 rounded-md skeleton-shimmer" />
              <div className="w-32 h-5 rounded-md skeleton-shimmer" />
            </div>
          </div>

          {/* Price Card Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="w-32 h-3 rounded skeleton-shimmer" />
            <div className="flex items-center gap-3">
              <div className="w-28 h-8 rounded-lg skeleton-shimmer" />
              <div className="w-16 h-5 rounded skeleton-shimmer" />
              <div className="w-16 h-6 rounded-md skeleton-shimmer" />
            </div>
          </div>

          {/* Platform Purchase Links Skeletons */}
          <div className="space-y-2.5">
            <div className="w-36 h-3.5 rounded skeleton-shimmer" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-12 rounded-xl skeleton-shimmer" />
              <div className="h-12 rounded-xl skeleton-shimmer" />
              <div className="h-12 rounded-xl skeleton-shimmer" />
              <div className="h-12 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          {/* Features / Highlights Box Skeleton */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="w-40 h-4 rounded skeleton-shimmer" />
            <div className="space-y-2">
              <div className="w-full h-3.5 rounded skeleton-shimmer" />
              <div className="w-5/6 h-3.5 rounded skeleton-shimmer" />
              <div className="w-4/5 h-3.5 rounded skeleton-shimmer" />
            </div>
          </div>

          {/* Creator Review Video Box Skeleton */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="w-48 h-4 rounded skeleton-shimmer" />
            <div className="w-full h-20 rounded-xl skeleton-shimmer" />
          </div>

          {/* Specifications Table Skeleton */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="w-36 h-4 rounded skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-8 rounded-lg skeleton-shimmer" />
              <div className="h-8 rounded-lg skeleton-shimmer" />
              <div className="h-8 rounded-lg skeleton-shimmer" />
              <div className="h-8 rounded-lg skeleton-shimmer" />
            </div>
          </div>

          {/* Customer Reviews Section Skeleton */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="w-40 h-5 rounded skeleton-shimmer" />
              <div className="w-28 h-8 rounded-xl skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReviewSkeleton />
              <ReviewSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Panel Form Skeleton - Matches Admin Panel fields, analytics & management tabs
 */
export function AdminFormSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 rounded skeleton-shimmer" />
              <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
            </div>
            <div className="w-32 h-7 rounded-lg skeleton-shimmer" />
            <div className="w-20 h-2.5 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Main Admin Content / Form Box Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-4">
          <div className="w-48 h-6 rounded-lg skeleton-shimmer" />
          <div className="w-32 h-9 rounded-xl skeleton-shimmer" />
        </div>

        {/* Input fields grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="w-24 h-3 rounded skeleton-shimmer" />
            <div className="w-full h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-3 rounded skeleton-shimmer" />
            <div className="w-full h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-3 rounded skeleton-shimmer" />
            <div className="w-full h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-3 rounded skeleton-shimmer" />
            <div className="w-full h-10 rounded-xl skeleton-shimmer" />
          </div>
        </div>

        {/* Image Upload Area Skeleton */}
        <div className="space-y-2">
          <div className="w-32 h-3 rounded skeleton-shimmer" />
          <div className="w-full h-32 rounded-2xl skeleton-shimmer flex items-center justify-center" />
        </div>

        {/* Description Textarea Skeleton */}
        <div className="space-y-2">
          <div className="w-28 h-3 rounded skeleton-shimmer" />
          <div className="w-full h-24 rounded-xl skeleton-shimmer" />
        </div>

        {/* Platform Purchase Links Form Skeletons */}
        <div className="space-y-3 pt-2">
          <div className="w-40 h-4 rounded skeleton-shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-10 rounded-xl skeleton-shimmer" />
            <div className="h-10 rounded-xl skeleton-shimmer" />
            <div className="h-10 rounded-xl skeleton-shimmer" />
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="pt-4 flex justify-end gap-3">
          <div className="w-24 h-10 rounded-xl skeleton-shimmer" />
          <div className="w-36 h-10 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

/**
 * Wishlist Skeleton View - Renders skeleton cards grid with header
 */
export function WishlistSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-7 rounded-lg skeleton-shimmer" />
          <div className="w-64 h-3.5 rounded skeleton-shimmer" />
        </div>
        <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
        {Array.from({ length: count }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

/**
 * Hero / Category Filter Bar Skeleton
 */
export function CategoryBarSkeleton() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="w-24 h-9 rounded-xl skeleton-shimmer shrink-0" />
      ))}
    </div>
  );
}
