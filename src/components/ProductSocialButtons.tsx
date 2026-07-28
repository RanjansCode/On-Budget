import React from 'react';
import { Play, Instagram, Youtube, ExternalLink } from 'lucide-react';

interface ProductSocialButtonsProps {
  youtubeUrl?: string;
  instagramUrl?: string;
  onButtonClick?: () => void;
  className?: string;
}

/**
 * Ensures a URL starts with http:// or https:// for safe window.open redirection
 */
export function formatSocialUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ProductSocialButtons({
  youtubeUrl,
  instagramUrl,
  onButtonClick,
  className = '',
}: ProductSocialButtonsProps) {
  const formattedYoutube = youtubeUrl ? formatSocialUrl(youtubeUrl) : '';
  const formattedInstagram = instagramUrl ? formatSocialUrl(instagramUrl) : '';

  const handleOpen = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (onButtonClick) {
      onButtonClick();
    }
  };

  if (!formattedYoutube && !formattedInstagram) {
    return null;
  }

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {/* YouTube Button */}
      {formattedYoutube && (
        <button
          onClick={() => handleOpen(formattedYoutube)}
          type="button"
          className="w-full flex items-center justify-between px-5 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Youtube className="w-5 h-5 fill-current text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-extrabold tracking-wide font-display">Watch on YouTube</div>
              <div className="text-[10px] text-red-100 font-normal">Official product unboxing & video review</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-red-200 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* Instagram Button */}
      {formattedInstagram && (
        <button
          onClick={() => handleOpen(formattedInstagram)}
          type="button"
          className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-extrabold tracking-wide font-display">View on Instagram</div>
              <div className="text-[10px] text-pink-100 font-normal">Featured reel & aesthetic photo post</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-pink-200 group-hover:text-white transition-colors" />
        </button>
      )}
    </div>
  );
}
