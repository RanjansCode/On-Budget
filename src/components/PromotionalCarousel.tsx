import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ExternalLink } from 'lucide-react';
import { PromotionalBanner } from '../types';
import { getOptimizedImageUrl } from './ImageSkeleton';

interface PromotionalCarouselProps {
  banners: PromotionalBanner[];
  onSelectCategory?: (categoryId: string) => void;
  onOpenProduct?: (productId: string) => void;
}

/**
 * Evaluates whether a banner is currently active based on isActive toggle and date/time range.
 */
export function isBannerActive(banner: PromotionalBanner): boolean {
  if (!banner.isActive) return false;
  const now = Date.now();
  if (banner.startAt) {
    const start = new Date(banner.startAt).getTime();
    if (!isNaN(start) && start > now) return false;
  }
  if (banner.endAt) {
    const end = new Date(banner.endAt).getTime();
    if (!isNaN(end) && end < now) return false;
  }
  return true;
}

export function getBannerStatus(banner: PromotionalBanner): 'Active' | 'Inactive' | 'Scheduled' | 'Expired' {
  if (!banner.isActive) return 'Inactive';
  const now = Date.now();
  if (banner.startAt) {
    const start = new Date(banner.startAt).getTime();
    if (!isNaN(start) && start > now) return 'Scheduled';
  }
  if (banner.endAt) {
    const end = new Date(banner.endAt).getTime();
    if (!isNaN(end) && end < now) return 'Expired';
  }
  return 'Active';
}

export const PromotionalCarousel: React.FC<PromotionalCarouselProps> = ({
  banners,
  onSelectCategory,
  onOpenProduct
}) => {
  // Filter active banners & sort by display order ascending
  const activeBanners = banners
    .filter(isBannerActive)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = activeBanners.length;

  // Auto-sliding interval (4.5s)
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4500);

    return () => clearInterval(timer);
  }, [totalSlides, isPaused]);

  // Keep currentIndex valid if activeBanners changes
  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      setCurrentIndex(0);
    }
  }, [totalSlides, currentIndex]);

  const handlePauseBriefly = useCallback(() => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 6000);
  }, []);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    handlePauseBriefly();
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    handlePauseBriefly();
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    handlePauseBriefly();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe && totalSlides > 1) {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    } else if (isRightSwipe && totalSlides > 1) {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleBannerClick = (banner: PromotionalBanner) => {
    const dest = banner.destinationUrl?.trim();
    if (!dest) return;

    // Direct HTTP URL
    if (dest.startsWith('http://') || dest.startsWith('https://')) {
      window.open(dest, '_blank', 'noopener,noreferrer');
      return;
    }

    // Category ID match
    if (onSelectCategory) {
      onSelectCategory(dest);
    }
    // Product ID match
    if (onOpenProduct && dest.startsWith('prod-')) {
      onOpenProduct(dest);
    }
  };

  // Requirement: "If there are no active banners: Hide the entire promotional carousel section. Do not leave a large empty space."
  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Promotional Offers Carousel"
      className="relative w-full max-w-7xl mx-auto my-2 sm:my-4 transition-all duration-300 select-none group/carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container wrapper with rounded corners & subtle border */}
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
        
        {/* Carousel Inner Track */}
        <div
          className="flex transition-transform duration-500 ease-out w-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {activeBanners.map((banner, index) => (
            <div
              key={banner.id || index}
              onClick={() => handleBannerClick(banner)}
              className="w-full shrink-0 relative cursor-pointer overflow-hidden bg-slate-950"
              style={{ aspectRatio: '1771 / 835' }}
            >
              {/* Background Poster Image */}
              <img
                src={getOptimizedImageUrl(banner.imageUrl, 1800)}
                alt={banner.name || banner.title || 'Promotional Offer'}
                className="w-full h-auto object-contain object-center transition-transform duration-700 group-hover/carousel:scale-[1.01]"
                style={{ width: '100%', height: 'auto', aspectRatio: '1771 / 835', objectFit: 'contain' }}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding={index === 0 ? 'sync' : 'async'}
                onError={(e) => {
                  // Fallback for broken images
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1800&auto=format&fit=crop&q=80';
                }}
              />

              {/* Optional Text Overlay (Only rendered if title, subtitle, or buttonText exist) */}
              {(banner.title || banner.subtitle || banner.buttonText) && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent flex items-center p-3 sm:p-6 md:p-8 pointer-events-none">
                  <div className="max-w-xl space-y-1 sm:space-y-2 text-white pointer-events-auto">
                    
                    {/* Optional Title */}
                    {banner.title && (
                      <h3 className="text-xs sm:text-xl md:text-2xl font-black font-display text-white tracking-tight leading-tight drop-shadow-md">
                        {banner.title}
                      </h3>
                    )}

                    {/* Optional Subtitle */}
                    {banner.subtitle && (
                      <p className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-200 line-clamp-2 drop-shadow-sm">
                        {banner.subtitle}
                      </p>
                    )}

                    {/* Optional CTA Button */}
                    {banner.buttonText && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 bg-[#FF5A00] hover:bg-[#E04F00] text-white text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl shadow-lg transition-all font-display">
                          <span>{banner.buttonText}</span>
                          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Top-Right Badge (e.g. "SPECIAL OFFER") */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white tracking-widest uppercase flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A00] animate-ping" />
                Featured Offer
              </div>
            </div>
          ))}
        </div>

        {/* Previous / Next Arrow Controls (Shown if > 1 active slide) */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md border border-white/15 flex items-center justify-center opacity-80 hover:opacity-100 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg z-10"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md border border-white/15 flex items-center justify-center opacity-80 hover:opacity-100 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg z-10"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 z-10">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePauseBriefly();
                    setCurrentIndex(i);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentIndex
                      ? 'w-6 bg-[#FF5A00]'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PromotionalCarousel;
