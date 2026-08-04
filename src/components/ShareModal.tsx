import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Mail, Share2, Package } from 'lucide-react';
import { Product } from '../types';
import { useToast } from './Toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onShareTrack?: (method: string) => void;
}

export default function ShareModal({ isOpen, onClose, product, onShareTrack }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  let toast: ReturnType<typeof useToast> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toast = useToast();
  } catch (e) {
    // Fallback if ToastProvider is not present
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/product/${product.id}`;
  const shareTitle = product.title;

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (toast) {
      toast.success('Product link copied!');
    }
    if (onShareTrack) onShareTrack('copy_link');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareClick = (platform: string, url: string) => {
    if (onShareTrack) onShareTrack(platform);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Social URLs
  const socialLinks = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.84L0 24l6.327-1.492A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.802 0-3.513-.473-5.003-1.302l-.358-.2-.375.088-3.327.784.802-3.238.093-.374-.213-.376A9.957 9.957 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
        </svg>
      ),
      bg: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      bg: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      bg: 'bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${shareTitle} on In Our Budget!`)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      bg: 'bg-[#26A5E4] hover:bg-[#2094ce] text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${shareTitle} on In Our Budget!`)}`
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-4 h-4" />,
      bg: 'bg-slate-700 hover:bg-slate-800 text-white',
      url: `mailto:?subject=${encodeURIComponent(`In Our Budget - ${shareTitle}`)}&body=${encodeURIComponent(`Hey,\n\nCheck out this product on In Our Budget:\n\n${shareTitle}\n\nPrice: ₹${product.price}\nLink: ${shareUrl}`)}`
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Share this product"
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FF5A00]/10 text-[#FF5A00] rounded-2xl">
                  <Share2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Share this product
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Spread the deal with friends & setup lovers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Card Preview */}
            <div className="px-5 sm:px-6 pt-5 pb-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 bg-white"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {product.title}
                  </h4>
                  <p className="text-[11px] text-[#FF5A00] font-bold mt-0.5">
                    ₹{product.price.toLocaleString('en-IN')}
                    {product.originalPrice > product.price && (
                      <span className="text-slate-400 line-through text-[10px] ml-1.5 font-normal">
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Copy Link Section */}
            <div className="px-5 sm:px-6 py-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block mb-1.5">
                Product Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 select-all font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-[#FF5A00] hover:bg-[#E04F00] text-white shadow-sm hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Icons Grid */}
            <div className="p-5 sm:p-6 pt-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display block mb-2.5">
                Share to Platform
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {socialLinks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleShareClick(item.id, item.url)}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/80 hover:border-[#FF5A00]/50 dark:hover:border-[#FF5A00]/50 transition-all cursor-pointer group text-left"
                  >
                    <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${item.bg}`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#FF5A00] dark:group-hover:text-[#FF5A00] transition-colors truncate">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
