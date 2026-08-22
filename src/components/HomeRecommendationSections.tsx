import React, { useRef, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles
} from 'lucide-react';
import {
  Product,
  HomepageSectionConfig,
  HomepageSectionVisibility,
  DEFAULT_HOMEPAGE_SECTIONS_CONFIG
} from '../types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeletons';
import {
  getHomePageRecommendations,
  trackRecommendationClick
} from '../lib/recommendationEngine';
import { getProductsForSection } from '../utils/sectionFilterEngine';
import { renderSectionIcon } from '../utils/iconMap';
import { migrateLegacySectionsToConfig } from '../firebase/firestore';

interface HomeRecommendationSectionsProps {
  products: Product[];
  reels?: any[];
  wishlist: string[];
  recentlyViewedIds?: string[];
  sections?: HomepageSectionConfig[];
  sectionVisibility?: HomepageSectionVisibility | HomepageSectionConfig[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onOpenSocialLinks?: (product: Product) => void;
  currentCurrency?: string;
  isLoading?: boolean;
}

interface GenericSectionContainerProps {
  section: HomepageSectionConfig;
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onOpenSocialLinks?: (product: Product) => void;
  currentCurrency?: string;
  isLoading?: boolean;
}

function SectionRenderer({
  section,
  products,
  wishlist,
  onToggleWishlist,
  onOpenProduct,
  onOpenSocialLinks,
  currentCurrency,
  isLoading = false,
}: GenericSectionContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!isLoading && (!products || products.length === 0)) {
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
    trackRecommendationClick(section.title, productId, productTitle);
    onOpenProduct(productId);
  };

  const displayStyle = section.displayStyle || 'carousel';

  return (
    <section
      id={`section-${section.id}`}
      className="space-y-4 my-8 animate-in fade-in duration-300 text-left"
    >
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
        <div className="space-y-1 max-w-[85%]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-[#FF5A00]/10 text-[#FF5A00] shrink-0 flex items-center justify-center min-w-[28px] min-h-[28px]">
              {renderSectionIcon(section.icon)}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-display tracking-tight">
              {section.title}
            </h3>
            {section.badge && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {section.badge}
              </span>
            )}
          </div>
          {/* Only render subtitle if explicitly present and not blank */}
          {section.description && section.description.trim().length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              {section.description.trim()}
            </p>
          )}
        </div>

        {/* Carousel Scroll Controls (Only if carousel display style) */}
        {displayStyle === 'carousel' && !isLoading && products.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id={`scroll-left-${section.id}`}
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                canScrollLeft
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#FF5A00]'
                  : 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll left"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id={`scroll-right-${section.id}`}
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                canScrollRight
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#FF5A00]'
                  : 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll right"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content Rendering by Display Style */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-none py-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="shrink-0 w-[200px] sm:w-[240px] md:w-[260px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : displayStyle === 'grid_2' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {products.map(product => (
            <div key={`${section.id}-${product.id}`} className="w-full">
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
      ) : displayStyle === 'grid_3' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 py-2">
          {products.map(product => (
            <div key={`${section.id}-${product.id}`} className="w-full">
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
      ) : displayStyle === 'grid_4' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 py-2">
          {products.map(product => (
            <div key={`${section.id}-${product.id}`} className="w-full">
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
      ) : displayStyle === 'featured_large' && products.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-2">
          {/* Featured Spotlight Card */}
          <div className="lg:col-span-6 xl:col-span-5 h-full">
            <div className="h-full rounded-2xl border-2 border-[#FF5A00]/30 bg-gradient-to-b from-orange-500/5 to-transparent p-3 dark:border-[#FF5A00]/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5A00] mb-2 px-1">
                <Sparkles className="w-4 h-4" /> Spotlight Pick
              </div>
              <ProductCard
                product={products[0]}
                onOpenProduct={() => handleProductClick(products[0].id, products[0].title)}
                isWishlisted={wishlist.includes(products[0].id)}
                onToggleWishlist={onToggleWishlist}
                onOpenSocialLinks={onOpenSocialLinks}
                currentCurrency={currentCurrency}
              />
            </div>
          </div>
          {/* Companion Cards */}
          <div className="lg:col-span-6 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.slice(1, 5).map(product => (
              <div key={`${section.id}-${product.id}`}>
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
        </div>
      ) : (
        /* Default: Horizontal Swipe Carousel */
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-2.5 px-0.5"
        >
          {products.map(product => (
            <div
              key={`${section.id}-${product.id}`}
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
    </section>
  );
}

function HomeRecommendationSections({
  products,
  wishlist,
  recentlyViewedIds,
  sections,
  sectionVisibility,
  onToggleWishlist,
  onOpenProduct,
  onOpenSocialLinks,
  currentCurrency,
  isLoading = false,
}: HomeRecommendationSectionsProps) {
  // Normalize configuration: accepts sections array or legacy visibility map
  const activeSectionsConfig = useMemo(() => {
    const raw = sections || sectionVisibility;
    const allConfigs = migrateLegacySectionsToConfig(raw || DEFAULT_HOMEPAGE_SECTIONS_CONFIG);
    // Sort by order ascending
    return allConfigs
      .filter(s => s.status === 'published' && s.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections, sectionVisibility]);

  // Pre-calculate standard recommendation lists for built-in sections
  const builtInRecommendations = useMemo(() => {
    return getHomePageRecommendations(products, wishlist);
  }, [products, wishlist]);

  // Resolve products for each configured section
  const renderedSections = useMemo(() => {
    return activeSectionsConfig.map(sec => {
      let matchedProducts: Product[] = [];

      if (sec.isBuiltIn) {
        // Map built-in sections to their algorithms or custom filters
        switch (sec.builtInKey || sec.id) {
          case 'trendingToday':
            matchedProducts = builtInRecommendations.trendingToday;
            break;
          case 'topRated':
            matchedProducts = builtInRecommendations.topRated;
            break;
          case 'bestBudgetDeals':
            matchedProducts = builtInRecommendations.bestBudgetDeals;
            break;
          case 'newlyAdded':
            matchedProducts = builtInRecommendations.newlyAdded;
            break;
          case 'mostViewed':
            matchedProducts = builtInRecommendations.mostViewed;
            break;
          case 'mostWishlisted':
            matchedProducts = builtInRecommendations.mostWishlisted;
            break;
          case 'biggestDiscount':
            matchedProducts = builtInRecommendations.biggestDiscount;
            break;
          case 'mostPurchased':
            matchedProducts = builtInRecommendations.mostPurchased;
            break;
          case 'featuredInVideos':
            matchedProducts = builtInRecommendations.featuredInVideos;
            break;
          case 'personallyTested':
            matchedProducts = builtInRecommendations.personallyTested;
            break;
          default:
            matchedProducts = getProductsForSection(products, sec, wishlist, recentlyViewedIds);
        }
        // If maxProducts is customized
        if (sec.maxProducts && matchedProducts.length > sec.maxProducts) {
          matchedProducts = matchedProducts.slice(0, sec.maxProducts);
        }
      } else {
        // Custom section created by admin
        matchedProducts = getProductsForSection(products, sec, wishlist, recentlyViewedIds);
      }

      return {
        config: sec,
        products: matchedProducts,
      };
    }).filter(item => item.products.length > 0 || isLoading);
  }, [activeSectionsConfig, builtInRecommendations, products, wishlist, recentlyViewedIds, isLoading]);

  const hasAnyWishlistRecs = builtInRecommendations.wishlistRecommendations.length > 0;
  const hasContent = renderedSections.length > 0 || hasAnyWishlistRecs;

  if (!isLoading && !hasContent) {
    return null;
  }

  return (
    <div className="space-y-10 my-10 border-t border-b border-slate-200/60 dark:border-slate-800/80 py-8">
      {/* 🎯 Wishlist Custom Recommendations (if shopper saved wishlist items) */}
      {builtInRecommendations.wishlistRecommendations.map((rec, idx) => (
        <section
          key={`wish-rec-${idx}`}
          className="space-y-4 my-8 animate-in fade-in duration-300 text-left"
        >
          <div className="flex items-end justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-display tracking-tight">
                  {rec.title}
                </h3>
              </div>
              {rec.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  {rec.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-2.5 px-0.5">
            {rec.products.map(p => (
              <div
                key={`wish-rec-p-${p.id}`}
                className="shrink-0 w-[210px] sm:w-[250px] md:w-[270px] lg:w-[280px] snap-start flex flex-col"
              >
                <ProductCard
                  product={p}
                  onOpenProduct={() => onOpenProduct(p.id)}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onOpenSocialLinks={onOpenSocialLinks}
                  currentCurrency={currentCurrency}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Render Configuration-Driven Sections in Exact Admin-Defined Order */}
      {renderedSections.map(item => (
        <SectionRenderer
          key={`sec-${item.config.id}`}
          section={item.config}
          products={item.products}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          onOpenProduct={onOpenProduct}
          onOpenSocialLinks={onOpenSocialLinks}
          currentCurrency={currentCurrency}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

export default React.memo(HomeRecommendationSections);

