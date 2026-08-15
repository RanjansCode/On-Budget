import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Product } from '../types';
import ShareModal from './ShareModal';
import { getProductSlug } from '../lib/seo';

interface ProductShareButtonProps {
  product: Product;
  className?: string;
  showText?: boolean;
  onShareTrack?: (method: string) => void;
}

export default function ProductShareButton({
  product,
  className,
  showText = true,
  onShareTrack,
}: ProductShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const slug = getProductSlug(product);
    const productUrl = `${origin}/product/${slug}`;
    const shareTitle = product.title;
    const shareText = product.seoDescription || product.description || `Check out ${product.title} on In Our Budget!`;

    // Try Web Share API first
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: productUrl,
        });
        if (onShareTrack) onShareTrack('native_share');
        return;
      } catch (err: any) {
        // If user cancelled (AbortError), do nothing
        if (err.name === 'AbortError') {
          return;
        }
        // Otherwise fallback to custom modal
      }
    }

    // Fallback to custom modal
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${product.title}`}
        title="Share Product"
        className={
          className ||
          'flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#FF5A00] dark:hover:text-[#FF5A00] hover:border-[#FF5A00]/40 rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-2xs hover:scale-105 active:scale-95'
        }
      >
        <Share2 className="w-4 h-4 text-[#FF5A00]" />
        {showText && <span>Share</span>}
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        onShareTrack={onShareTrack}
      />
    </>
  );
}
