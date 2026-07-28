import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, VideoOff, Film } from 'lucide-react';
import { Product } from '../types';
import { ProductSocialButtons } from './ProductSocialButtons';

interface SocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export default function SocialLinksModal({ isOpen, onClose, product }: SocialLinksModalProps) {
  // Listen for ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const youtubeUrl = product?.youtubeUrl?.trim() || '';
  const instagramUrl = product?.instagramUrl?.trim() || '';
  const hasSocialLinks = Boolean(youtubeUrl || instagramUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Blurred Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Area */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 relative">
              <button
                onClick={onClose}
                type="button"
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-[#FF5A00] text-xs font-bold uppercase tracking-wider font-display mb-1">
                <Film className="w-3.5 h-3.5" /> Product Media
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
                Watch this Product
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                Choose where you'd like to view the content.
              </p>

              {/* Product Info Preview (Optional context) */}
              {product && (
                <div className="mt-4 flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-display">
                      {product.title}
                    </p>
                    <p className="text-[10px] text-[#FF5A00] font-extrabold font-mono mt-0.5">
                      ₹{product.price}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Content Body */}
            <div className="p-6">
              {hasSocialLinks ? (
                <ProductSocialButtons
                  youtubeUrl={youtubeUrl}
                  instagramUrl={instagramUrl}
                  onButtonClick={onClose}
                />
              ) : (
                /* Empty State when no links exist */
                <div className="text-center py-6 px-4 space-y-4">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                    <VideoOff className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">
                      No Media Links Available
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                      No photo or video has been added for this product yet.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    type="button"
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer mt-2"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
