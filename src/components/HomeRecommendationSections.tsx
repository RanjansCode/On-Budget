import React, { useRef, useState, useMemo } from 'react';
import {
  Flame, Star, DollarSign, Sparkles, TrendingUp, Heart, Tag,
  ShoppingBag, Video, FlaskConical, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeletons';
import { getHomePageRecommendations, trackRecommendationClick } from '../lib/recommendationEngine';

interface HomeRecommendationSectionsProps {
  products: Product[];
  reels?: any[];
  wishlist: string[];
  recentlyViewedIds?: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onOpenSocialLinks?: (product: Product) => void;
  currentCurrency?: string;
  isLoading?: boolean;
}

interface CarouselProps {
  key?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onOpenSocialLinks?: (product: Product) => void;
  currentCurrency?: string;
  isLoading?: boolean;
  sectionKey: string;
}

function SectionCarousel({
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
  sectionKey,
}: CarouselProps) {
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

  const handleProductClick = (productId: string, productTitle: string) => {
    trackRecommendationClick(title, productId, productTitle);
    onOpenProduct(productId);
  };

  return (
    <div className="space-y-4 my-8 animate-in fade-in duration-300 text-left">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FF5A00]/10 text-[#FF5A00]">{icon}</span>
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

        {/* Carousel Scroll Controls */}
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
            <div key={idx} className="shrink-0 w-[200px] sm:w-[240px] md:w-[260px]">
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
              key={`${sectionKey}-${product.id}`}
              className="shrink-0 w-[210px] sm:w-[250px] md:w-[270px] lg:w-[280px] snap-start flex flex-col"
            >
              <ProductCard
                product={product}
                onOpenProduct={() => handleProductClick(product.id, product.title)}
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

function HomeRecommendationSections({
  products,
  wishlist,
  onToggleWishlist,
  onOpenProduct,
  onOpenSocialLinks,
  currentCurrency,
  isLoading = false,
}: HomeRecommendationSectionsProps) {
  const recommendations = useMemo(() => {
    return getHomePageRecommendations(products, wishlist);
  }, [products, wishlist]);

  return (
    <div className="space-y-10 my-10 border-t border-b border-slate-200/60 dark:border-slate-800/80 py-8">
      {/* 🎯 Wishlist Custom Recommendations */}
      {recommendations.wishlistRecommendations.map((rec, idx) => (
        <SectionCarousel
          key={`wish-rec-${idx}`}
          sectionKey={`wish-rec-${idx}`}
          title={rec.title}
          subtitle={rec.subtitle}
          icon={<Heart className="w-5 h-5 text-red-500 fill-red-500" />}
          products={rec.products}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          onOpenProduct={onOpenProduct}
          onOpenSocialLinks={onOpenSocialLinks}
          currentCurrency={currentCurrency}
          isLoading={isLoading}
        />
      ))}

      {/* 🔥 1. Trending Today */}
      <SectionCarousel
        sectionKey="trending-today"
        title="🔥 Trending Today"
        subtitle="Gadgets receiving highest real-time views, wishlist saves & shares"
        icon={<Flame className="w-5 h-5" />}
        products={recommendations.trendingToday}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* ⭐ 2. Top Rated */}
      <SectionCarousel
        sectionKey="top-rated"
        title="⭐ Top Rated"
        subtitle="Highly rated gadgets with top reviewer verifications"
        icon={<Star className="w-5 h-5" />}
        products={recommendations.topRated}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* 💰 3. Best Budget Deals */}
      <SectionCarousel
        sectionKey="best-budget"
        title="💰 Best Budget Deals"
        subtitle="Super affordable picks under ₹499 with heavy savings"
        icon={<DollarSign className="w-5 h-5" />}
        products={recommendations.bestBudgetDeals}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* 🆕 4. Newly Added */}
      <SectionCarousel
        sectionKey="newly-added"
        title="🆕 Newly Added"
        subtitle="Freshly uploaded budget recommendations"
        icon={<Sparkles className="w-5 h-5" />}
        products={recommendations.newlyAdded}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* 📈 5. Most Viewed */}
      <SectionCarousel
        sectionKey="most-viewed"
        title="📈 Most Viewed"
        subtitle="The most clicked product detail pages across the store"
        icon={<TrendingUp className="w-5 h-5" />}
        products={recommendations.mostViewed}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* ❤️ 6. Most Wishlisted */}
      <SectionCarousel
        sectionKey="most-wishlisted"
        title="❤️ Most Wishlisted"
        subtitle="Products shoppers save most to buy later"
        icon={<Heart className="w-5 h-5" />}
        products={recommendations.mostWishlisted}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* 🏷️ 7. Biggest Discount */}
      <SectionCarousel
        sectionKey="biggest-discount"
        title="🏷️ Biggest Discount"
        subtitle="Highest percentage discount drops available today"
        icon={<Tag className="w-5 h-5" />}
        products={recommendations.biggestDiscount}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* 🛒 8. Most Purchased */}
      <SectionCarousel
        sectionKey="most-purchased"
        title="🛒 Most Purchased"
        subtitle="Top converted products on Amazon, Meesho, Flipkart"
        icon={<ShoppingBag className="w-5 h-5" />}
        products={recommendations.mostPurchased}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* 🎥 9. Featured In Videos */}
      <SectionCarousel
        sectionKey="featured-videos"
        title="🎥 Featured In Videos"
        subtitle="Products with Instagram Reels and YouTube unboxing breakdowns"
        icon={<Video className="w-5 h-5" />}
        products={recommendations.featuredInVideos}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />

      {/* 🧪 10. Personally Tested */}
      <SectionCarousel
        sectionKey="personally-tested"
        title="🧪 Personally Tested"
        subtitle="100% physically unboxed, tested, and approved by the creator"
        icon={<FlaskConical className="w-5 h-5" />}
        products={recommendations.personallyTested}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={onOpenSocialLinks}
        currentCurrency={currentCurrency}
        isLoading={isLoading}
      />
    </div>
  );
}

export default React.memo(HomeRecommendationSections);
