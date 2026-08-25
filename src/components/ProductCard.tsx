import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Star, Film, CheckCircle, Maximize2, Layers } from 'lucide-react';
import { Product } from '../types';
import ImageLightboxModal from './ImageLightboxModal';
import { formatCurrencyPrice, detectUserCurrency } from '../utils/currency';
import { getProductBestPrice } from '../utils/retailerOffers';
import ImageSkeleton from './ImageSkeleton';
import ProductShareButton from './ProductShareButton';
import { getProductMainImage, getProductImages } from '../utils/imageUtils';
import { getProductPriceRange } from '../utils/variantUtils';
import PlatformLogo from './PlatformLogo';

interface ProductCardProps {
  key?: string;
  product: Product;
  onOpenProduct: (productId: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenSocialLinks?: (product: Product) => void;
  currentCurrency?: string;
  priority?: boolean;
}

function ProductCard({
  product,
  onOpenProduct,
  isWishlisted,
  onToggleWishlist,
  onOpenSocialLinks,
  currentCurrency: propCurrency,
  priority = false,
}: ProductCardProps) {
  const { title, brand, badges } = product;
  const productImages = getProductImages(product);
  const mainImage = getProductMainImage(product);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeCurrencyCode, setActiveCurrencyCode] = useState(propCurrency || 'INR');

  useEffect(() => {
    if (propCurrency) {
      setActiveCurrencyCode(propCurrency);
    } else {
      const initial = detectUserCurrency();
      setActiveCurrencyCode(initial.currency.code);
    }

    const handleCurrencyChange = (e: any) => {
      setActiveCurrencyCode(e.detail);
    };

    window.addEventListener('onbudget_currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('onbudget_currency_changed', handleCurrencyChange);
  }, [propCurrency]);

  const bestPriceInfo = getProductBestPrice(product);
  const { bestPrice, originalPrice, discountPercent, retailerName, bestOffer } = bestPriceInfo;
  
  // Price range calculation for variants
  const priceRange = getProductPriceRange(product);
  const hasVariants = product.hasVariants && priceRange.activeVariantsCount > 0;
  const effectiveDisplayPrice = hasVariants && priceRange.minPrice > 0 ? priceRange.minPrice : bestPrice;
  const effectiveOrigPrice = hasVariants && priceRange.minOriginalPrice > 0 ? priceRange.minOriginalPrice : originalPrice;
  const effectiveDiscount = hasVariants ? priceRange.maxDiscount : discountPercent;

  const hasDiscount = effectiveDiscount > 0;
  const formattedMainPrice = formatCurrencyPrice(effectiveDisplayPrice, activeCurrencyCode);
  const formattedOrigPrice = formatCurrencyPrice(effectiveOrigPrice, activeCurrencyCode);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.25 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg dark:hover:shadow-slate-950/40 relative group h-full min-w-0"
      >
        {/* Top Overlay Actions (Wishlist + Share) */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex items-center gap-1 sm:gap-1.5">
          <ProductShareButton
            product={product}
            showText={false}
            className="p-1.5 sm:p-2 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xs text-slate-500 hover:text-[#FF5A00] dark:text-slate-400 dark:hover:text-[#FF5A00] border border-slate-200/60 dark:border-slate-800 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-xs"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className="p-1.5 sm:p-2 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 border border-slate-200/60 dark:border-slate-800 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-xs"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all ${isWishlisted ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
          </button>
        </div>

        {/* Main Image Area - Entirely Clickable for Navigation to Product Detail Page */}
        <div
          onClick={() => onOpenProduct(product.id)}
          className="relative w-full h-[155px] xs:h-[175px] sm:h-[220px] md:h-[240px] lg:h-[260px] overflow-hidden bg-slate-100/90 dark:bg-slate-950/90 flex items-center justify-center p-2.5 sm:p-4 cursor-pointer shrink-0 border-b border-slate-200/40 dark:border-slate-800/60 group/img transition-all duration-300"
          title="Click to view product details"
        >
          <ImageSkeleton
            src={mainImage}
            alt={title}
            priority={priority}
            containerClassName="w-full h-full"
            className="max-w-full max-h-full w-auto h-auto object-contain object-center group-hover/img:scale-105 transition-transform duration-300 ease-out select-none"
            referrerPolicy="no-referrer"
          />

          {/* Full Preview Lightbox Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 p-1 sm:p-1.5 bg-slate-900/70 hover:bg-[#FF5A00] text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-xs border border-white/10 cursor-pointer shadow-sm"
            title="Expand Full Screen Image"
          >
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Perfect Circular Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-20 w-9 h-9 sm:w-12 sm:h-12 md:w-13 md:h-13 bg-[#FF5A00] text-white rounded-full flex flex-col items-center justify-center text-center shadow-md border border-white/20 select-none font-display pointer-events-none shrink-0">
              <span className="text-[9px] sm:text-[11px] sm:text-xs font-black leading-none">{effectiveDiscount}%</span>
              <span className="text-[6px] sm:text-[7px] sm:text-[8px] font-extrabold uppercase tracking-tight leading-none mt-0.5">OFF</span>
            </div>
          )}

          {/* Clean Curated Trust Badges (Prioritized 1-2 to prevent visual noise) */}
          <div className="absolute bottom-2 left-2 right-10 flex flex-wrap gap-1 pointer-events-none z-10">
            {hasVariants && (
              <span className="inline-flex items-center gap-1 bg-slate-900/90 dark:bg-slate-800/90 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-xs">
                <Layers className="w-3 h-3 text-[#FF5A00]" /> {priceRange.activeVariantsCount} Options
              </span>
            )}
            {badges.personallyTested ? (
              <span className="inline-flex items-center gap-1 bg-emerald-600/90 dark:bg-emerald-950/90 text-white dark:text-emerald-300 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-xs">
                <CheckCircle className="w-3 h-3 text-emerald-200" /> 100% Tested
              </span>
            ) : badges.recommended ? (
              <span className="inline-flex items-center gap-1 bg-amber-600/90 dark:bg-amber-950/90 text-white dark:text-amber-300 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-xs">
                <Star className="w-3 h-3 fill-current text-amber-200" /> Curated
              </span>
            ) : badges.seenInReel ? (
              <span className="inline-flex items-center gap-1 bg-sky-600/90 dark:bg-sky-950/90 text-white dark:text-sky-300 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-xs">
                <Film className="w-3 h-3 text-sky-200" /> Seen in Reel
              </span>
            ) : badges.trending ? (
              <span className="inline-flex items-center gap-1 bg-rose-600/90 dark:bg-rose-950/90 text-white dark:text-rose-300 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-rose-200" /> Trending
              </span>
            ) : null}
          </div>
        </div>

        {/* Product Information Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1.5 min-w-0">
            {brand && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-normal block truncate">{brand}</span>
            )}
            <h3
              onClick={() => onOpenProduct(product.id)}
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#FF5A00] dark:hover:text-[#FF5A00] transition-colors line-clamp-2 cursor-pointer font-display leading-snug break-words"
            >
              {title}
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pricing Rows & Details Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-2.5 min-w-0">
            <div className="flex flex-col shrink-0 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {priceRange.hasPriceRange && (
                  <span className="text-xs font-bold text-slate-400">From</span>
                )}
                <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white font-display">
                  {formattedMainPrice.formatted}
                </span>
                {effectiveOrigPrice > effectiveDisplayPrice && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                    {formattedOrigPrice.formatted}
                  </span>
                )}
              </div>
              {hasVariants ? (
                <span className="text-xs font-semibold text-[#FF5A00] flex items-center gap-1 truncate mt-0.5">
                  <span>Multiple options available</span>
                </span>
              ) : retailerName ? (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 truncate mt-0.5">
                  <PlatformLogo platformName={retailerName} retailerId={bestOffer?.retailerId} className="h-3.5 w-auto max-w-[50px] object-contain shrink-0" />
                  <span className="truncate">Best price on {retailerName}</span>
                </span>
              ) : activeCurrencyCode !== 'INR' ? (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Base: ₹{bestPrice}
                </span>
              ) : null}
            </div>

            <button
              onClick={() => onOpenProduct(product.id)}
              className="w-full sm:w-auto text-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-[#FF5A00] hover:text-white dark:hover:bg-[#FF5A00] dark:hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-xs shrink-0 active:scale-95"
            >
              Review Details
            </button>
          </div>
        </div>
      </motion.div>

      {/* Full-Screen Lightbox Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={productImages}
        productTitle={title}
      />
    </>
  );
}

export default React.memo(ProductCard);
