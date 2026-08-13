import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Heart, Share2, ShieldAlert, CheckCircle, Star, Sparkles,
  ExternalLink, Play, HelpCircle, Cpu, AlertCircle, Film,
  Check, Copy, RefreshCw, ShoppingBag, Plus, Sparkle, ArrowRight,
  ChevronLeft, ChevronRight, Maximize2
} from 'lucide-react';
import { Product, Reel } from '../types';
import SocialLinksModal from './SocialLinksModal';
import PlatformLogo from './PlatformLogo';
import ImageLightboxModal from './ImageLightboxModal';
import { getPurchaseLinks } from '../utils/purchaseLinks';
import { getNormalizedRetailerOffers, getProductBestPrice, calculateDiscountPercent } from '../utils/retailerOffers';
import { formatUrl } from '../utils/validation';
import { formatCurrencyPrice, detectUserCurrency } from '../utils/currency';
import { calculateDiscount } from '../utils/discount';
import ImageSkeleton, { getOptimizedImageUrl } from './ImageSkeleton';
import ProductRecommendations from './ProductRecommendations';
import ProductShareButton from './ProductShareButton';
import { getProductImages } from '../utils/imageUtils';
import {
  updateDocumentSEO,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  getCanonicalUrl,
  getProductSlug,
  slugify,
  getDomain
} from '../lib/seo';

interface ProductDetailProps {
  product: Product;
  reels: Reel[];
  onBack: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  allProducts: Product[];
  onTrackAffiliateClick: (productId: string, platform: string) => void;
  wishlist?: string[];
  recentlyViewedIds?: string[];
}

export default function ProductDetail({
  product,
  reels,
  onBack,
  isWishlisted,
  onToggleWishlist,
  onOpenProduct,
  allProducts,
  onTrackAffiliateClick,
  wishlist = [],
  recentlyViewedIds = [],
}: ProductDetailProps) {
  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image');
  const [activeCreatorTab, setActiveCreatorTab] = useState<'review' | 'setup' | 'unboxing' | 'photos'>('review');
  const [reportState, setReportState] = useState<'idle' | 'success'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeCurrencyCode, setActiveCurrencyCode] = useState(() => detectUserCurrency().currency.code);

  // Gallery & Multiple Image Navigation State
  const productImages = getProductImages(product);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.id]);

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    const handleCurrencyChange = (e: any) => {
      setActiveCurrencyCode(e.detail);
    };
    window.addEventListener('onbudget_currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('onbudget_currency_changed', handleCurrencyChange);
  }, []);

  // Dynamic SEO, Canonical Link, Open Graph & JSON-LD Structured Data
  useEffect(() => {
    const previousTitle = document.title;
    const domain = 'https://inourbudget.vercel.app';
    const slug = getProductSlug(product);
    const canonicalUrl = getCanonicalUrl(`/product/${slug}`, domain);

    // Format: "[Product Name] – Price, Details & Review | In Our Budget"
    const title = product.seoTitle?.trim()
      ? product.seoTitle
      : `${product.title} – Price, Details & Review | In Our Budget`;

    const priceText = product.price ? ` priced at ₹${product.price}` : '';
    const categoryText = product.category ? ` in ${product.category}` : '';
    const brandText = product.brand ? ` by ${product.brand}` : '';

    const description = product.seoDescription?.trim()
      ? product.seoDescription
      : `Discover ${product.title}${brandText}${categoryText}${priceText}. Explore specifications, key features, and honest reviews on In Our Budget.`;

    const productSchema = generateProductSchema(product, domain);
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: product.category, url: `/category/${slugify(product.category)}` },
      { name: product.title, url: `/product/${slug}` }
    ], domain);
    const orgSchema = generateOrganizationSchema(domain);
    const websiteSchema = generateWebSiteSchema(domain);

    updateDocumentSEO({
      title,
      description,
      keywords: product.searchTags || [product.title, product.brand, product.category].filter(Boolean),
      canonicalUrl,
      imageUrl: product.images?.[0],
      ogType: 'product',
      jsonLdSchemas: [productSchema, breadcrumbSchema, orgSchema, websiteSchema]
    });

    return () => {
      document.title = previousTitle;
    };
  }, [product]);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Check if product has any video/social links
  const hasSocialLinks = Boolean(product.youtubeUrl?.trim() || product.instagramUrl?.trim());
  const discountInfo = calculateDiscount(product.originalPrice, product.price);
  const frequentlyBought = allProducts.filter(p => product.frequentlyBoughtTogether?.includes(p.id));

  // Better alternatives
  const alternativesList = product.alternatives || [];

  // Similar products fallback
  const similarProducts = allProducts.filter(
    p => p.category === product.category && p.id !== product.id
  ).slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleReport = () => {
    setReportState('success');
    setTimeout(() => setReportState('idle'), 3000);
  };

  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    setAiError('');
    setAiSummary('');

    try {
      const response = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          whyIRecommend: product.whyIRecommend,
          pros: product.pros,
          cons: product.cons,
          specifications: product.specifications,
        }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiSummary(data.text);
      } else {
        setAiError(data.error || 'Failed to fetch review summary. Verify your Gemini secret configuration.');
      }
    } catch (err) {
      console.error(err);
      setAiError('Failed to reach server. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Back Button / Actions Header bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs transition-colors">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#FF5A00] dark:hover:text-[#FF5A00] transition-colors cursor-pointer font-display"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF5A00]" />
          Back to Explore
        </button>

        <div className="flex items-center gap-2">
          {/* Wishlist */}
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            aria-label={isWishlisted ? `Remove ${product.title} from Wishlist` : `Save ${product.title} to Wishlist`}
            className={`p-2 bg-slate-50 dark:bg-slate-950 border rounded-xl cursor-pointer transition-all duration-200 ${
              isWishlisted
                ? 'text-red-500 border-red-200 bg-red-50 dark:border-red-950/40 dark:bg-red-950/15'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
            }`}
            title="Save to Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>

          {/* Share */}
          <ProductShareButton
            product={product}
            showText={true}
            onShareTrack={(m) => onTrackAffiliateClick(product.id, `share_${m}`)}
          />

          {/* Report Stock Issue */}
          <button
            type="button"
            onClick={handleReport}
            aria-label={`Report stock or pricing issue for ${product.title}`}
            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 rounded-xl transition-all cursor-pointer relative"
            title="Report Out of Stock"
          >
            <ShieldAlert className="w-4 h-4" />
            {reportState === 'success' && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap z-30">
                Reported! Thank you
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation for User & Search Crawlers */}
      <nav aria-label="Breadcrumb" className="px-1 -mt-4 text-xs text-slate-500 dark:text-slate-400">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <button onClick={onBack} className="hover:text-[#FF5A00] transition-colors cursor-pointer font-medium">
              Home
            </button>
          </li>
          <li>
            <span className="text-slate-400 dark:text-slate-600">/</span>
          </li>
          <li>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{product.category}</span>
          </li>
          {product.brand && (
            <>
              <li>
                <span className="text-slate-400 dark:text-slate-600">/</span>
              </li>
              <li>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{product.brand}</span>
              </li>
            </>
          )}
          <li>
            <span className="text-slate-400 dark:text-slate-600">/</span>
          </li>
          <li className="text-[#FF5A00] font-bold truncate max-w-[200px] sm:max-w-[320px]">
            {product.title}
          </li>
        </ol>
      </nav>

      {/* Main Product Layout Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Media Player Section with Phone simulation */}
        <div className="space-y-4">
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative aspect-4/3 sm:aspect-16/10 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-md group/detailimg"
          >
            {activeMedia === 'image' ? (
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="w-full h-full flex items-center justify-center p-4 bg-slate-100/90 dark:bg-slate-950/90 cursor-pointer"
                title="Click to open full-screen image preview"
              >
                <ImageSkeleton
                  src={productImages[selectedImageIndex] || productImages[0]}
                  alt={product.title}
                  priority={selectedImageIndex === 0}
                  containerClassName="w-full h-full"
                  className="max-w-full max-h-full w-auto h-auto object-contain object-center group-hover/detailimg:scale-105 transition-transform duration-300 select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <video
                src={product.videos[0]}
                autoPlay
                controls
                muted
                loop
                className="w-full h-full object-cover"
              />
            )}

            {/* Previous / Next Arrow Controls (Desktop & Mobile Tap) - Rendered if > 1 image */}
            {activeMedia === 'image' && productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label={`Previous image for ${product.title}`}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/70 hover:bg-[#FF5A00] text-white transition-all backdrop-blur-xs cursor-pointer shadow-md opacity-85 hover:opacity-100 focus:outline-none"
                  title="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label={`Next image for ${product.title}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/70 hover:bg-[#FF5A00] text-white transition-all backdrop-blur-xs cursor-pointer shadow-md opacity-85 hover:opacity-100 focus:outline-none"
                  title="Next Image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Pagination indicator (e.g. 1 / 5) */}
            {activeMedia === 'image' && productImages.length > 1 && (
              <div className="absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold tracking-wider backdrop-blur-md select-none border border-white/10 shadow-xs font-display">
                {selectedImageIndex + 1} / {productImages.length}
              </div>
            )}

            {/* Expand Fullscreen Button */}
            {activeMedia === 'image' && (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label={`Enlarge image for ${product.title}`}
                className="absolute bottom-3.5 right-3.5 z-20 p-2 rounded-xl bg-slate-900/80 hover:bg-[#FF5A00] text-white transition-all backdrop-blur-md cursor-pointer border border-white/10 shadow-xs"
                title="Expand Fullscreen Image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Media Overlay Toggles - Render Photo/Video button ONLY if social links exist */}
            {hasSocialLinks && (
              <div className="absolute bottom-3.5 left-3.5 z-20 flex gap-2">
                <button
                  onClick={() => setIsSocialModalOpen(true)}
                  type="button"
                  className="text-[10px] font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md text-slate-800 dark:text-white border-slate-200/50 dark:border-slate-800 hover:bg-[#FF5A00] hover:text-white hover:border-[#FF5A00] shadow-sm group font-display"
                >
                  <Film className="w-3.5 h-3.5 text-[#FF5A00] group-hover:text-white" />
                  <span>Photo/Video</span>
                </button>
              </div>
            )}
          </div>

          {/* Thumbnail Navigation Strip (Rendered ONLY if > 1 image) */}
          {activeMedia === 'image' && productImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {productImages.map((img, idx) => {
                const isMain = idx === 0;
                const isSelected = idx === selectedImageIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative rounded-2xl overflow-hidden shrink-0 transition-all duration-200 cursor-pointer border-2 bg-slate-100 dark:bg-slate-950 p-1 ${
                      isSelected
                        ? 'border-[#FF5A00] ring-2 ring-[#FF5A00]/30 scale-100 opacity-100 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-400 dark:hover:border-slate-600 scale-95'
                    }`}
                    title={isMain ? `Image ${idx + 1} (Main/Cover)` : `Image ${idx + 1}`}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden rounded-xl">
                      <img
                        src={getOptimizedImageUrl(img, 150)}
                        alt={`${product.title} thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    {isMain && (
                      <span className="absolute top-1 left-1 bg-[#FF5A00] text-white text-[7px] font-black uppercase tracking-wider px-1 py-0.2 rounded shadow-xs">
                        Main
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Curation Details Panel */}
        <div className="space-y-6">
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              {/* Circular Discount Badge near Product Title */}
              {discountInfo.hasDiscount && (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FF5A00] text-white rounded-full flex flex-col items-center justify-center text-center shadow-md border border-white/20 select-none font-display shrink-0 my-0.5">
                  <span className="text-xs sm:text-sm font-black leading-none">{discountInfo.percentage}%</span>
                  <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-tight leading-none mt-0.5">OFF</span>
                </div>
              )}

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-display">
                    {product.brand}
                  </span>
                  <span className="text-[10px] text-[#FF5A00] font-black uppercase tracking-widest font-display">
                    Curated Product
                  </span>
                </div>
                
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight font-display">
                  {product.title}
                </h1>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.badges.personallyTested && <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-display">✅ 100% Tested</span>}
              {product.badges.recommended && <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-display">⭐ Recommended</span>}
              {product.badges.trending && <span className="text-[10px] font-bold bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full font-display animate-pulse">🔥 Viral Trend</span>}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            {product.description}
          </p>

          {/* Pricing Card & Retailer Offers */}
          {(() => {
            const bestInfo = getProductBestPrice(product);
            const activeOffers = getNormalizedRetailerOffers(product, false);

            return (
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#FF5A00] font-black uppercase tracking-wider font-display bg-[#FF5A00]/10 px-2 py-0.5 rounded-md">
                        Best Price
                      </span>
                      {bestInfo.retailerName && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                          <span>via</span>
                          <PlatformLogo platformName={bestInfo.retailerName} className="h-4.5 w-auto max-w-[80px] object-contain shrink-0" />
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{bestInfo.retailerName}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2.5 mt-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-display">
                        {formatCurrencyPrice(bestInfo.bestPrice, activeCurrencyCode).formatted}
                      </span>
                      {bestInfo.originalPrice > bestInfo.bestPrice && (
                        <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 line-through">
                          {formatCurrencyPrice(bestInfo.originalPrice, activeCurrencyCode).formatted}
                        </span>
                      )}
                      {bestInfo.discountPercent > 0 && (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg">
                          {bestInfo.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {bestInfo.amountSaved > 0 && (
                      <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-display">
                        <span>You Save {formatCurrencyPrice(bestInfo.amountSaved, activeCurrencyCode).formatted} ({bestInfo.discountPercent}% OFF)</span>
                      </p>
                    )}

                    {bestInfo.retailerName && activeOffers.length > 1 && (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Lowest price available on <strong>{bestInfo.retailerName}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Multiple Retailer Offers / Purchase Links */}
                {activeOffers.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-display">
                        Purchase Links & Verified Retailers:
                      </span>
                      {activeOffers.length > 1 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {activeOffers.length} Stores Available
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeOffers.map((offer, idx) => {
                        const finalUrl = formatUrl(offer.productUrl);
                        const isBestOffer = offer.offerPrice === bestInfo.bestPrice && offer.offerPrice > 0;
                        const formattedOfferPrice = formatCurrencyPrice(offer.offerPrice, activeCurrencyCode);
                        const formattedOrigPrice = formatCurrencyPrice(offer.originalPrice, activeCurrencyCode);
                        const disc = offer.discountPercent || calculateDiscountPercent(offer.originalPrice, offer.offerPrice);

                        return (
                          <button
                            key={offer.id || `${offer.retailerName}-${idx}`}
                            type="button"
                            onClick={() => {
                              if (offer.retailerName) {
                                onTrackAffiliateClick(product.id, offer.retailerName);
                              }
                              if (finalUrl) {
                                window.open(finalUrl, "_blank", "noopener,noreferrer");
                              }
                            }}
                            className={`flex flex-col justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer group relative ${
                              isBestOffer
                                ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 hover:border-[#FF5A00]/40'
                            }`}
                          >
                            {/* Top row: Retailer Logo & Name + Best Price / Discount badge */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="flex items-center gap-2">
                                <PlatformLogo platformName={offer.retailerName} className="h-6 w-auto max-w-[100px] object-contain shrink-0" />
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-[#FF5A00] transition-colors">
                                  {offer.retailerName}
                                </span>
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isBestOffer && (
                                  <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tight shadow-2xs">
                                    Best Price
                                  </span>
                                )}
                                {disc > 0 && (
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md">
                                    {disc}% OFF
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bottom row: Price display + Buy Button */}
                            <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-slate-200/40 dark:border-slate-800/60">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-extrabold text-slate-950 dark:text-white">
                                  {formattedOfferPrice.formatted}
                                </span>
                                {offer.originalPrice > offer.offerPrice && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 line-through">
                                    {formattedOrigPrice.formatted}
                                  </span>
                                )}
                              </div>

                              <span className="flex items-center gap-1 text-xs font-bold text-[#FF5A00] group-hover:translate-x-0.5 transition-transform shrink-0">
                                <span>Buy on {offer.retailerName}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Creator notes block */}
          <div className="p-4 bg-[#FF5A00]/5 border border-[#FF5A00]/10 rounded-2xl space-y-1.5">
            <span className="text-[10px] text-[#FF5A00] font-black uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Sparkles className="w-3.5 h-3.5" /> Creator Recommendation Opinion
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed font-sans">
              &ldquo;{product.whyIRecommend}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* AI REVIEW SUMMARIZER WIDGET */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white flex items-center gap-2 font-display">
              <Sparkles className="w-4.5 h-4.5 text-[#FF5A00] animate-pulse" />
              In Our Budget AI Review Summarizer
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generate an unbiased, bulleted highlight breakdown powered by the server-side Gemini AI model.
            </p>
          </div>

          <button
            onClick={handleGenerateAISummary}
            disabled={aiLoading}
            className="bg-[#FF5A00] hover:bg-[#E04F00] disabled:bg-slate-100 dark:disabled:bg-slate-850 text-white disabled:text-slate-400 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                Generate AI Summary
              </>
            )}
          </button>
        </div>

        {/* AI summary text display */}
        <AnimatePresence>
          {aiSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-2xl text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2 whitespace-pre-wrap font-sans"
              dangerouslySetInnerHTML={{
                __html: aiSummary
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#FF5A00]">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }}
            />
          )}

          {aiError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FREQUENTLY BOUGHT TOGETHER (Bundle section) */}
      {frequentlyBought.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-[#FF5A00]" />
            <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider font-display">Frequently Bought Together Bundle</h3>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Combine these matching items to complete your workstation setups while maintaining maximum savings.
          </p>

          <div className="flex flex-col lg:flex-row items-center gap-5 pt-3">
            {/* Combo Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 flex-1">
              {/* Primary Item */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-2xl max-w-xs shrink-0 shadow-2xs">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-11 h-11 object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{product.title}</h4>
                  <span className="text-[11px] font-black text-[#FF5A00]">
                    {formatCurrencyPrice(product.price, activeCurrencyCode).formatted}
                  </span>
                </div>
              </div>

              {frequentlyBought.map(p => (
                <React.Fragment key={p.id}>
                  <div className="text-slate-400 text-lg font-bold"><Plus className="w-4 h-4" /></div>
                  
                  <div
                    onClick={() => onOpenProduct(p.id)}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 hover:border-[#FF5A00]/40 rounded-2xl max-w-xs cursor-pointer shrink-0 shadow-2xs group transition-colors"
                  >
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-11 h-11 object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-[#FF5A00] truncate transition-colors">{p.title}</h4>
                      <span className="text-[11px] font-black text-[#FF5A00]">
                        {formatCurrencyPrice(p.price, activeCurrencyCode).formatted}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Total Calculations box */}
            <div className="w-full lg:w-56 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-center flex flex-col justify-between h-full space-y-3 shrink-0">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-display">Combo Package Total</span>
                <div className="text-xl font-black text-slate-950 dark:text-white mt-1">
                  {formatCurrencyPrice(product.price + frequentlyBought.reduce((acc, cur) => acc + cur.price, 0), activeCurrencyCode).formatted}
                </div>
                <p className="text-[9px] text-emerald-500 font-bold uppercase mt-0.5">Bundle deals verified</p>
              </div>

              <button
                onClick={() => {
                  onToggleWishlist(product.id);
                  frequentlyBought.forEach(p => onToggleWishlist(p.id));
                }}
                className="w-full bg-[#FF5A00] hover:bg-[#E04F00] text-white py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer active:scale-97"
              >
                Wishlist Combo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BETTER ALTERNATIVES (Requested list of products that are better alternatives) */}
      {alternativesList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[#FF5A00]" />
            <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider font-display">Better Tested Alternatives</h3>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Compare our curated choice directly with other tested models to make an educated purchase.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {alternativesList.map((altText, index) => {
              // Try to find if this matches any product in our db
              const matchedProd = allProducts.find(ap => ap.title.toLowerCase().includes(altText.toLowerCase()) || ap.id === altText);
              
              return (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-2xl flex flex-col justify-between gap-3 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-[#FF5A00]/10 text-[#FF5A00] font-bold px-2 py-0.5 rounded uppercase tracking-wider block w-max font-mono">Tested Alt</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{matchedProd ? matchedProd.title : altText}</h4>
                    </div>
                    {matchedProd && (
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrencyPrice(matchedProd.price, activeCurrencyCode).formatted}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {matchedProd 
                      ? `We recommend this alternative for users seeking a more premium version. Rated ${Number(matchedProd.rating).toFixed(1)}/5 stars.` 
                      : "A premium tier alternative model evaluated personally. Best for advanced setups."
                    }
                  </p>

                  {matchedProd && (
                    <button
                      onClick={() => onOpenProduct(matchedProd.id)}
                      className="mt-1 text-[10px] font-bold text-[#FF5A00] flex items-center gap-1 hover:underline text-left self-start cursor-pointer"
                    >
                      Compare alternative details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Creator Log tabs (Review, Setup, Unboxing, Photos) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs transition-colors">
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto gap-2 scrollbar-thin">
          <button
            onClick={() => setActiveCreatorTab('review')}
            className={`text-xs font-extrabold pb-3 px-4 border-b-2 transition-all cursor-pointer font-display whitespace-nowrap ${
              activeCreatorTab === 'review' ? 'border-[#FF5A00] text-[#FF5A00]' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Creator Detailed Review
          </button>
          <button
            onClick={() => setActiveCreatorTab('setup')}
            className={`text-xs font-extrabold pb-3 px-4 border-b-2 transition-all cursor-pointer font-display whitespace-nowrap ${
              activeCreatorTab === 'setup' ? 'border-[#FF5A00] text-[#FF5A00]' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Setup Guide
          </button>
          <button
            onClick={() => setActiveCreatorTab('unboxing')}
            className={`text-xs font-extrabold pb-3 px-4 border-b-2 transition-all cursor-pointer font-display whitespace-nowrap ${
              activeCreatorTab === 'unboxing' ? 'border-[#FF5A00] text-[#FF5A00]' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inside Box
          </button>
        </div>

        {/* Tab content renders */}
        <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-sans">
          {activeCreatorTab === 'review' && (
            <div className="space-y-5 text-left">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider font-display">Creator Rating Log</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1" title={`${product.creatorReview.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((starIndex) => {
                        const ratingVal = Number(product.creatorReview.rating) || 0;
                        const starFillRatio = Math.max(0, Math.min(1, ratingVal - (starIndex - 1)));
                        const fillPercent = Math.round(starFillRatio * 100);
                        return (
                          <div key={starIndex} className="relative inline-block shrink-0">
                            <Star className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 stroke-1" />
                            {fillPercent > 0 && (
                              <div
                                className="absolute top-0 left-0 overflow-hidden"
                                style={{ width: `${fillPercent}%` }}
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono ml-0.5">
                      {Number(product.creatorReview.rating).toFixed(1)} / 5
                    </span>
                  </div>
                </div>
              </div>

              <p className="whitespace-pre-wrap leading-relaxed">{product.creatorReview.reviewText}</p>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 font-display">My Hands-on Evaluation:</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{product.creatorReview.myExperience}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-2xl">
                <span className="text-[9px] text-[#FF5A00] font-bold block uppercase tracking-wider font-mono">Final Verified Verdict</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 leading-normal">{product.creatorReview.myVerdict}</p>
              </div>
            </div>
          )}

          {activeCreatorTab === 'setup' && (
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">How to configure and set up this gadget:</h4>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-500 dark:text-slate-400">{product.creatorReview.setupGuideText}</p>
            </div>
          )}

          {activeCreatorTab === 'unboxing' && (
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">Packaging boxes & items included:</h4>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-500 dark:text-slate-400">{product.creatorReview.unboxingText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tech Specifications and Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Specifications list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2.5 font-display">Technical Specifications</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {product.specifications.map(spec => (
              <div key={spec.name} className="flex justify-between items-center py-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{spec.name}</span>
                <span className="text-slate-900 dark:text-white font-bold">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pros & Cons list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2.5 font-display">Tested Pros & Cons</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-3">
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider block font-display">Tested Pros</span>
              <ul className="text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                {product.pros.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-left">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider block font-display">Tested Cons</span>
              <ul className="text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                {product.cons.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2.5 font-display">Frequently Asked Questions</h3>
        <div className="space-y-3.5">
          {product.faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 rounded-2xl space-y-2 text-left shadow-3xs">
              <h4 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5 font-display">
                <HelpCircle className="w-4 h-4 text-[#FF5A00] shrink-0" />
                {faq.question}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-5.5 leading-relaxed font-sans">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Product Recommendation Engine (10 Amazon/Flipkart style sections) */}
      <ProductRecommendations
        currentProduct={product}
        allProducts={allProducts}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onOpenProduct={onOpenProduct}
        onOpenSocialLinks={() => setIsSocialModalOpen(true)}
        currentCurrency={activeCurrencyCode}
        recentlyViewedIds={recentlyViewedIds}
        onTrackAffiliateClick={onTrackAffiliateClick}
      />

      {/* Social Links Modal Popup */}
      <SocialLinksModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        product={product}
      />

      {/* Full-Screen Lightbox Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={productImages}
        initialIndex={selectedImageIndex}
        productTitle={product.title}
      />
    </div>
  );
}
