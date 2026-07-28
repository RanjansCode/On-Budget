import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Sparkles, TrendingUp, ThumbsUp,
  Clock, ShoppingBag, Tag, Eye, Heart, Check, Plus, RefreshCw
} from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeletons';
import { formatCurrencyPrice, detectUserCurrency } from '../utils/currency';

interface ProductRecommendationsProps {
  currentProduct: Product;
  allProducts: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onOpenSocialLinks?: (product: Product) => void;
  currentCurrency?: string;
  recentlyViewedIds?: string[];
  onTrackAffiliateClick?: (productId: string, platform: string) => void;
}

interface RecommendationCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onOpenSocialLinks?: (product: Product) => void;
  currentCurrency?: string;
  isLoading?: boolean;
}

/**
 * Reusable Horizontal Carousel Component with Desktop Nav Arrows & Mobile Touch Snap Scroll
 */
function RecommendationCarousel({
  title,
  subtitle,
  icon,
  products,
  wishlist,
  onToggleWishlist,
  onOpenProduct,
  onOpenSocialLinks,
  currentCurrency,
  isLoading = false,
}: RecommendationCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // If no products and not loading, hide section completely
  if (!isLoading && products.length === 0) {
    return null;
  }

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="space-y-4 my-8 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-end justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#FF5A00]">{icon}</span>}
            <h3 className="text-base font-bold text-slate-950 dark:text-white font-display tracking-tight">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Scroll Controls (Desktop & Mobile) */}
        {!isLoading && products.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                canScrollLeft
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#FF5A00]'
                  : 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                canScrollRight
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#FF5A00]'
                  : 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel Track */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-none py-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="shrink-0 w-[240px] sm:w-[260px] md:w-[280px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-2.5 px-0.5"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-[230px] sm:w-[260px] md:w-[275px] snap-start flex flex-col"
            >
              <ProductCard
                product={product}
                onOpenProduct={onOpenProduct}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onOpenSocialLinks={onOpenSocialLinks}
                currentCurrency={currentCurrency}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Frequently Bought Together Section (Section 8)
 */
function FrequentlyBoughtTogetherSection({
  currentProduct,
  allProducts,
  wishlist,
  onToggleWishlist,
  onOpenProduct,
  currentCurrency,
  onTrackAffiliateClick
}: {
  currentProduct: Product;
  allProducts: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  currentCurrency?: string;
  onTrackAffiliateClick?: (productId: string, platform: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Find 1-3 complimentary products
  const bundleItems = useMemo(() => {
    let matches: Product[] = [];
    if (currentProduct.frequentlyBoughtTogether && currentProduct.frequentlyBoughtTogether.length > 0) {
      matches = allProducts.filter(p => currentProduct.frequentlyBoughtTogether?.includes(p.id));
    }
    if (matches.length === 0) {
      matches = allProducts.filter(
        p => p.id !== currentProduct.id && p.category === currentProduct.category
      ).slice(0, 3);
    }
    return matches.slice(0, 3);
  }, [currentProduct, allProducts]);

  useEffect(() => {
    setSelectedIds([currentProduct.id, ...bundleItems.map(p => p.id)]);
  }, [currentProduct, bundleItems]);

  if (bundleItems.length === 0) return null;

  const allBundleProducts = [currentProduct, ...bundleItems];

  const totalBundlePrice = allBundleProducts
    .filter(p => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  const totalOriginalPrice = allBundleProducts
    .filter(p => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + (p.originalPrice || p.price), 0);

  const toggleSelect = (id: string) => {
    if (id === currentProduct.id) return; // cannot deselect main product
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const activeCurrency = currentCurrency || detectUserCurrency().currency.code;

  const handleAddBundleToWishlist = () => {
    selectedIds.forEach(id => {
      if (!wishlist.includes(id)) {
        onToggleWishlist(id);
      }
    });
  };

  return (
    <div className="my-8 p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-3xl space-y-6 text-left shadow-2xs">
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <ShoppingBag className="w-5 h-5 text-[#FF5A00]" />
        <div>
          <h3 className="text-base font-bold text-slate-950 dark:text-white font-display">
            Frequently Bought Together
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Combine top gadgets to maximize budget value
          </p>
        </div>
      </div>

      {/* Bundle Products Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Products Flex List */}
        <div className="lg:col-span-8 flex flex-wrap items-center gap-3">
          {allBundleProducts.map((p, index) => {
            const isSelected = selectedIds.includes(p.id);
            const isMain = p.id === currentProduct.id;

            return (
              <React.Fragment key={p.id}>
                {index > 0 && (
                  <div className="text-slate-400 dark:text-slate-600 font-bold text-lg select-none px-1">
                    +
                  </div>
                )}
                <div
                  onClick={() => onOpenProduct(p.id)}
                  className={`relative p-3 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer transition-all flex items-center gap-3 w-full sm:w-[220px] ${
                    isSelected
                      ? 'border-[#FF5A00]/60 ring-1 ring-[#FF5A00]/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-14 h-14 object-cover rounded-xl shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-display">
                      {p.title}
                    </p>
                    <p className="text-xs font-black text-[#FF5A00] mt-1">
                      {formatCurrencyPrice(p.price, activeCurrency).formatted}
                    </p>
                    {!isMain && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(p.id);
                        }}
                        className="mt-1.5 text-[10px] font-bold text-slate-500 hover:text-[#FF5A00] underline cursor-pointer"
                      >
                        {isSelected ? 'Remove' : 'Add to bundle'}
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Summary & Action Box */}
        <div className="lg:col-span-4 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-display">
              Total Bundle Price
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-[#FF5A00] font-display">
                {formatCurrencyPrice(totalBundlePrice, activeCurrency).formatted}
              </span>
              {totalOriginalPrice > totalBundlePrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrencyPrice(totalOriginalPrice, activeCurrency).formatted}
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedIds.length} items selected in this bundle
          </p>

          <button
            onClick={handleAddBundleToWishlist}
            className="w-full bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Buy Bundle Together
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Recommendation Engine Component
 */
export default function ProductRecommendations({
  currentProduct,
  allProducts,
  wishlist,
  onToggleWishlist,
  onOpenProduct,
  onOpenSocialLinks,
  currentCurrency,
  recentlyViewedIds = [],
  onTrackAffiliateClick
}: ProductRecommendationsProps) {
  const [isReady, setIsReady] = useState(false);

  // Lazy load/defer recommendation computations slightly so main product renders instant
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, [currentProduct.id]);

  // Section 1: Similar Products (Same Category)
  const similarProducts = useMemo(() => {
    return allProducts
      .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
      .slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 2: More From Same Brand
  const brandProducts = useMemo(() => {
    if (!currentProduct.brand) return [];
    const brandLower = currentProduct.brand.trim().toLowerCase();
    return allProducts
      .filter(p => p.id !== currentProduct.id && p.brand && p.brand.trim().toLowerCase() === brandLower)
      .slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 3: More In This Budget (±20% price)
  const budgetProducts = useMemo(() => {
    const minPrice = currentProduct.price * 0.8;
    const maxPrice = currentProduct.price * 1.2;
    return allProducts
      .filter(p => p.id !== currentProduct.id && p.price >= minPrice && p.price <= maxPrice)
      .slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 4: Top Rated Products
  const topRatedProducts = useMemo(() => {
    return [...allProducts]
      .filter(p => p.id !== currentProduct.id)
      .sort((a, b) => {
        const ratingA = a.creatorReview?.rating || a.rating || 0;
        const ratingB = b.creatorReview?.rating || b.rating || 0;
        return ratingB - ratingA;
      })
      .slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 5: Trending Products
  const trendingProducts = useMemo(() => {
    return allProducts
      .filter(
        p => p.id !== currentProduct.id && p.badges?.trending === true
      )
      .slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 6: Recently Added
  const recentlyAddedProducts = useMemo(() => {
    return [...allProducts]
      .filter(p => p.id !== currentProduct.id)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      })
      .slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 7: Customers Also Viewed
  const customersAlsoViewed = useMemo(() => {
    // Collect products in same or similar categories
    const categoryMatches = allProducts.filter(
      p => p.id !== currentProduct.id && p.category === currentProduct.category
    );
    if (categoryMatches.length >= 3) {
      return categoryMatches.slice(0, 10);
    }
    // Fallback to top rating/popular
    return allProducts.filter(p => p.id !== currentProduct.id).slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 9: You May Also Like (Slightly randomized on product change)
  const youMayAlsoLike = useMemo(() => {
    const pool = allProducts.filter(p => p.id !== currentProduct.id);
    // Deterministic seed-like shuffle based on product title length
    return [...pool]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
  }, [currentProduct, allProducts]);

  // Section 10: Continue Shopping / Recently Viewed
  const recentlyViewedProducts = useMemo(() => {
    // Read from prop or localStorage fallback
    let ids = recentlyViewedIds;
    if (ids.length === 0) {
      const local = localStorage.getItem('onbudget_recently_viewed');
      if (local) {
        try { ids = JSON.parse(local); } catch (e) { ids = []; }
      }
    }
    return allProducts
      .filter(p => p.id !== currentProduct.id && ids.includes(p.id))
      .slice(0, 10);
  }, [currentProduct, allProducts, recentlyViewedIds]);

  return (
    <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 space-y-6">
      {/* SECTION 1: Similar Products */}
      <RecommendationCarousel
        title="Similar Products"
        subtitle="Products you may also like in this category"
        icon={<Sparkles className="w-5 h-5" />}
        products={similarProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 8: Frequently Bought Together (Bundle Box) */}
      <FrequentlyBoughtTogetherSection
        currentProduct={currentProduct}
        allProducts={allProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        currentCurrency={currentCurrency}
        onTrackAffiliateClick={onTrackAffiliateClick}
      />

      {/* SECTION 2: More From Same Brand */}
      <RecommendationCarousel
        title={currentProduct.brand ? `More From ${currentProduct.brand}` : 'More From This Brand'}
        subtitle={`Explore other top-rated products from ${currentProduct.brand || 'this brand'}`}
        icon={<Tag className="w-5 h-5" />}
        products={brandProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 3: More In This Budget */}
      <RecommendationCarousel
        title="More Products In This Budget"
        subtitle={`Handpicked alternatives in the same ±20% price tier`}
        icon={<ShoppingBag className="w-5 h-5" />}
        products={budgetProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 4: Top Rated Products */}
      <RecommendationCarousel
        title="Top Rated Products"
        subtitle="Gadgets with highest reviewer ratings"
        icon={<ThumbsUp className="w-5 h-5" />}
        products={topRatedProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 5: Trending Products */}
      <RecommendationCarousel
        title="Trending Products"
        subtitle="Viral & popular tested gadgets this month"
        icon={<TrendingUp className="w-5 h-5" />}
        products={trendingProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 6: Recently Added */}
      <RecommendationCarousel
        title="Recently Added"
        subtitle="Freshly reviewed catalog additions"
        icon={<Clock className="w-5 h-5" />}
        products={recentlyAddedProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 7: Customers Also Viewed */}
      <RecommendationCarousel
        title="Customers Also Viewed"
        subtitle="Popular choices among shoppers who viewed this item"
        icon={<Eye className="w-5 h-5" />}
        products={customersAlsoViewed}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 9: You May Also Like */}
      <RecommendationCarousel
        title="You May Also Like"
        subtitle="Personalized suggestions based on your catalog exploration"
        icon={<Heart className="w-5 h-5" />}
        products={youMayAlsoLike}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* SECTION 10: Continue Shopping / Recently Viewed */}
      <RecommendationCarousel
        title="Continue Shopping"
        subtitle="Products you inspected recently"
        icon={<RefreshCw className="w-5 h-5" />}
        products={recentlyViewedProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />
    </div>
  );
}
