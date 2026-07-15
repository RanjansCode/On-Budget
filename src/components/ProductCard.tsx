import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Star, Film, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onOpenProduct: (productId: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export default function ProductCard({
  product,
  onOpenProduct,
  isWishlisted,
  onToggleWishlist,
}: ProductCardProps) {
  const { title, price, originalPrice, discount, brand, images, badges } = product;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg dark:hover:shadow-slate-950/40 relative group h-full"
    >
      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        className="absolute top-3 right-3 z-20 p-2 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 border border-slate-200/50 dark:border-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart className={`w-3.5 h-3.5 transition-all ${isWishlisted ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
      </button>

      {/* Main Image Area with hover zoom */}
      <div
        onClick={() => onOpenProduct(product.id)}
        className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-950 cursor-pointer shrink-0"
      >
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#FF5A00] text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md shadow-sm z-10 font-display">
            {discount}% OFF
          </span>
        )}

        {/* Badges Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
          {badges.seenInReel && (
            <span className="inline-flex items-center gap-1 bg-sky-500/90 dark:bg-sky-950/90 text-white dark:text-sky-400 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs">
              <Film className="w-2.5 h-2.5" /> Reel
            </span>
          )}
          {badges.personallyTested && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/90 dark:bg-emerald-950/90 text-white dark:text-emerald-400 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs">
              <CheckCircle className="w-2.5 h-2.5" /> 100% Tested
            </span>
          )}
          {badges.recommended && (
            <span className="inline-flex items-center gap-1 bg-amber-500/90 dark:bg-amber-950/90 text-white dark:text-amber-400 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs">
              <Star className="w-2.5 h-2.5 fill-current" /> Curated
            </span>
          )}
          {badges.trending && (
            <span className="inline-flex items-center gap-1 bg-red-500/90 dark:bg-red-950/90 text-white dark:text-red-400 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs animate-pulse">
              <Sparkles className="w-2.5 h-2.5" /> Viral
            </span>
          )}
        </div>
      </div>

      {/* Product Information Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {brand && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-display block">{brand}</span>
          )}
          <h3
            onClick={() => onOpenProduct(product.id)}
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#FF5A00] dark:hover:text-[#FF5A00] transition-colors line-clamp-1 cursor-pointer font-display"
            style={
              product.id === 'prod-1'
                ? { color: '#ff4f00' }
                : product.id === 'prod-3'
                ? { color: '#ff2c00' }
                : undefined
            }
          >
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing Rows & Details Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-3 gap-2">
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-sm font-black text-slate-950 dark:text-white">₹{price}</span>
            {originalPrice > price && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">₹{originalPrice}</span>
            )}
          </div>

          <button
            onClick={() => onOpenProduct(product.id)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-[#FF5A00] group-hover:text-white text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer"
          >
            Review Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
