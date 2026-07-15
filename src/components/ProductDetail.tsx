import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Heart, Share2, ShieldAlert, CheckCircle, Star, Sparkles,
  ExternalLink, Play, HelpCircle, Cpu, AlertCircle,
  Check, Copy, RefreshCw, ShoppingBag, Plus, Sparkle, ArrowRight
} from 'lucide-react';
import { Product, Reel } from '../types';

interface ProductDetailProps {
  product: Product;
  reels: Reel[];
  onBack: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  allProducts: Product[];
  onTrackAffiliateClick: (productId: string, platform: string) => void;
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
}: ProductDetailProps) {
  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image');
  const [activeCreatorTab, setActiveCreatorTab] = useState<'review' | 'setup' | 'unboxing' | 'photos'>('review');
  const [reportState, setReportState] = useState<'idle' | 'success'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Frequently Bought Together items
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
            onClick={() => onToggleWishlist(product.id)}
            className={`p-2 bg-slate-50 dark:bg-slate-950 border rounded-xl cursor-pointer transition-all duration-200 ${
              isWishlisted
                ? 'text-red-500 border-red-200 bg-red-50 dark:border-red-950/40 dark:bg-red-950/15'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
            }`}
            title="Save to Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleCopyLink}
            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer relative"
            title="Share Product"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            {copiedLink && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap z-30">
                Link copied!
              </span>
            )}
          </button>

          {/* Report Stock Issue */}
          <button
            onClick={handleReport}
            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-500 rounded-xl transition-all cursor-pointer relative"
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

      {/* Main Product Layout Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Media Player Section with Phone simulation */}
        <div className="space-y-6">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-md">
            {activeMedia === 'image' ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
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

            {/* Media Overlay Toggles */}
            <div className="absolute bottom-4 left-4 z-10 flex gap-2">
              <button
                onClick={() => setActiveMedia('image')}
                className={`text-[10px] font-bold px-3.5 py-2 rounded-lg border transition-all cursor-pointer ${
                  activeMedia === 'image'
                    ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                    : 'bg-white/80 dark:bg-black/60 backdrop-blur-md text-slate-800 dark:text-white border-slate-200/50 dark:border-slate-850 hover:bg-white dark:hover:bg-black/85'
                }`}
              >
                Photo Gallery
              </button>
              <button
                onClick={() => setActiveMedia('video')}
                className={`text-[10px] font-bold px-3.5 py-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMedia === 'video'
                    ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                    : 'bg-white/80 dark:bg-black/60 backdrop-blur-md text-slate-800 dark:text-white border-slate-200/50 dark:border-slate-850 hover:bg-white dark:hover:bg-black/85'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                Unboxing Clip
              </button>
            </div>
          </div>

          {/* Instagram / YouTube Shorts Vertical Simulator Mockup Frame */}
        </div>

        {/* Curation Details Panel */}
        <div className="space-y-6">
          <div className="space-y-2.5">
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

          {/* Pricing Card & Multiple Affiliate Links */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider font-display">Personally Curated Savings Price</span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-2xl font-black text-slate-950 dark:text-white">₹{product.price}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 line-through">₹{product.originalPrice}</span>
                  <span className="text-[10px] bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/20 font-bold px-1.5 py-0.5 rounded font-mono">
                    {product.discount}% OFF
                  </span>
                </div>
              </div>


            </div>

            {/* Multiple platform Links */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider font-display">Verified E-Commerce Partners (Comparison):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.affiliateLinks.map(link => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onTrackAffiliateClick(product.id, link.platform)}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 hover:border-[#FF5A00]/40 dark:hover:border-[#FF5A00]/40 text-slate-800 dark:text-slate-100 rounded-2xl transition-all font-semibold text-xs group shadow-2xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-[#FF5A00]" />
                      Buy on <strong className="text-slate-900 dark:text-white group-hover:text-[#FF5A00] transition-colors">{link.platform}</strong>
                    </span>
                    <span className="text-[9px] text-slate-400 group-hover:text-[#FF5A00] font-bold transition-all">Direct Deal →</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

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
                  <span className="text-[11px] font-black text-[#FF5A00]">₹{product.price}</span>
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
                      <span className="text-[11px] font-black text-[#FF5A00]">₹{p.price}</span>
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
                  ₹{product.price + frequentlyBought.reduce((acc, cur) => acc + cur.price, 0)}
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
                      <span className="text-xs font-black text-slate-900 dark:text-white">₹{matchedProd.price}</span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {matchedProd 
                      ? `We recommend this alternative for users seeking a more premium version. Rated ${matchedProd.rating}/5 stars.` 
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
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    {Array.from({ length: Math.round(product.creatorReview.rating) }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono ml-1.5">{product.creatorReview.rating} / 5</span>
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

      {/* Better alternatives / Similar Products list */}
      {similarProducts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest font-display text-left">Similar Tested Gadgets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {similarProducts.map(p => (
              <div
                key={p.id}
                onClick={() => onOpenProduct(p.id)}
                className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-[#FF5A00]/40 dark:hover:border-[#FF5A00]/40 rounded-2xl cursor-pointer flex gap-3 group transition-all shadow-2xs text-left"
              >
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="w-12 h-12 object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#FF5A00] transition-colors truncate font-display">
                    {p.title}
                  </h4>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-xs font-black text-[#FF5A00]">₹{p.price}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">₹{p.originalPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
