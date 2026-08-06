import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Sparkles, TrendingUp, ThumbsUp,
  Clock, ShoppingBag, Tag, Eye, Heart, RefreshCw, Layers,
  Store, Zap, Trash2, Box
} from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeletons';
import { formatCurrencyPrice, detectUserCurrency } from '../utils/currency';
import {
  getProductDetailRecommendations,
  clearRecentlyViewedIds,
  trackRecommendationClick
} from '../lib/recommendationEngine';

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
  onClearRecentlyViewed?: () => void;
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
  actionButton?: React.ReactNode;
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
  actionButton,
}: RecommendationCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const handleCardClick = (product: Product) => {
    trackRecommendationClick(title, product.id, product.title);
    onOpenProduct(product.id);
  };

  return (
    <div className="space-y-4 my-8 animate-in fade-in duration-300 text-left">
      {/* Section Header */}
      <div className="flex items-end justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon && <span className="p-1.5 rounded-lg bg-[#FF5A00]/10 text-[#FF5A00]">{icon}</span>}
            <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-display tracking-tight">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actionButton}

          {/* Carousel Scroll Controls */}
          {!isLoading && products.length > 0 && (
            <div className="flex items-center gap-1.5">
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
      </div>

      {/* Carousel Track */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-none py-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="shrink-0 w-[210px] sm:w-[250px] md:w-[270px]">
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
              className="shrink-0 w-[210px] sm:w-[250px] md:w-[270px] lg:w-[280px] snap-start flex flex-col"
            >
              <ProductCard
                product={product}
                onOpenProduct={() => handleCardClick(product)}
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
 * Frequently Viewed / Bought Together Section
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
    if (id === currentProduct.id) return;
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
            Frequently Viewed Together
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complimentary desk setups & budget accessories often paired together
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
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
            Wishlist All Selected Items
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Product Recommendations Component (Renders all 10 Product Detail Sections)
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
  onTrackAffiliateClick,
  onClearRecentlyViewed,
}: ProductRecommendationsProps) {
  const [isReady, setIsReady] = useState(false);
  const [localRecentlyViewed, setLocalRecentlyViewed] = useState<string[]>(recentlyViewedIds);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [currentProduct.id]);

  useEffect(() => {
    setLocalRecentlyViewed(recentlyViewedIds);
  }, [recentlyViewedIds]);

  const recs = useMemo(() => {
    return getProductDetailRecommendations(currentProduct, allProducts, wishlist, localRecentlyViewed);
  }, [currentProduct, allProducts, wishlist, localRecentlyViewed]);

  const handleClearHistory = () => {
    clearRecentlyViewedIds();
    setLocalRecentlyViewed([]);
    if (onClearRecentlyViewed) {
      onClearRecentlyViewed();
    }
  };

  return (
    <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 space-y-6">
      
      {/* 1. Similar Products */}
      <RecommendationCarousel
        title="Similar Products"
        subtitle="Gadgets matching this item's category and features"
        icon={<Sparkles className="w-5 h-5" />}
        products={recs.similarProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* 2. Customers Also Viewed */}
      <RecommendationCarousel
        title="Customers Also Viewed"
        subtitle="Popular choices among shoppers looking at this product"
        icon={<Eye className="w-5 h-5" />}
        products={recs.customersAlsoViewed}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* 3. You May Also Like */}
      <RecommendationCarousel
        title="You May Also Like"
        subtitle="Personalized recommendations curated for your budget"
        icon={<Heart className="w-5 h-5" />}
        products={recs.youMayAlsoLike}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* 4. Products From Same Brand */}
      {currentProduct.brand && (
        <RecommendationCarousel
          title={`Products From ${currentProduct.brand}`}
          subtitle={`Explore more curated budget products by ${currentProduct.brand}`}
          icon={<Tag className="w-5 h-5" />}
          products={recs.sameBrand}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          onOpenProduct={onOpenProduct}
          onOpenSocialLinks={onOpenSocialLinks}
          currentCurrency={currentCurrency}
          isLoading={!isReady}
        />
      )}

      {/* 5. Products In Same Category */}
      <RecommendationCarousel
        title={`Products In ${currentProduct.category}`}
        subtitle={`Top picks from the ${currentProduct.category} collection`}
        icon={<Layers className="w-5 h-5" />}
        products={recs.sameCategory}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* 6. Products With Similar Price */}
      <RecommendationCarousel
        title="Products With Similar Price"
        subtitle={`Handpicked alternatives in the same ±25% budget tier`}
        icon={<ShoppingBag className="w-5 h-5" />}
        products={recs.similarPrice}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* 7. More Products From Same Marketplace */}
      <RecommendationCarousel
        title="More Products From Same Marketplace"
        subtitle="Products available on the same purchase platforms"
        icon={<Store className="w-5 h-5" />}
        products={recs.sameMarketplace}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* 8. Frequently Viewed Together */}
      <FrequentlyBoughtTogetherSection
        currentProduct={currentProduct}
        allProducts={allProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        currentCurrency={currentCurrency}
        onTrackAffiliateClick={onTrackAffiliateClick}
      />

      {/* 9. Recommended Accessories */}
      <RecommendationCarousel
        title="Recommended Accessories"
        subtitle="Cases, stands, cables, and setup accessories for your setup"
        icon={<Box className="w-5 h-5" />}
        products={recs.recommendedAccessories}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={!isReady}
      />

      {/* 10. Recently Viewed */}
      {recs.recentlyViewed.length > 0 && (
        <RecommendationCarousel
          title="Recently Viewed"
          subtitle="Products you looked at recently (stored locally)"
          icon={<Clock className="w-5 h-5" />}
          products={recs.recentlyViewed}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          onOpenProduct={onOpenProduct}
          onOpenSocialLinks={onOpenSocialLinks}
          currentCurrency={currentCurrency}
          isLoading={!isReady}
          actionButton={
            <button
              onClick={handleClearHistory}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear Recently Viewed History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          }
        />
      )}
    </div>
  );
}
