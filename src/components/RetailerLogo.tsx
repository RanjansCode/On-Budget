import React, { useState } from 'react';
import { ShoppingBag, Globe, Store } from 'lucide-react';
import { getRetailerLogoUrl, getRetailerBrandConfig, normalizeRetailerKey } from '../utils/retailerLogos';

interface RetailerLogoProps {
  retailerName: string;
  logoUrl?: string;
  className?: string;
  iconOnly?: boolean;
  alt?: string;
}

/**
 * Reusable Retailer Logo Component
 * Loads official local or uploaded logo images for Amazon, Meesho, Flipkart, Myntra, etc.
 * Includes automatic fail-safe vector fallback if asset load fails.
 */
export default function RetailerLogo({
  retailerName,
  logoUrl: propLogoUrl,
  className = 'h-6 w-auto object-contain shrink-0',
  iconOnly = false,
  alt,
}: RetailerLogoProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedLogoUrl = getRetailerLogoUrl(retailerName, propLogoUrl);
  const brand = getRetailerBrandConfig(retailerName);
  const normalizedKey = normalizeRetailerKey(retailerName);

  // If local or uploaded image failed to load, render a clean vector badge fallback
  if (hasError) {
    return (
      <span
        className="inline-flex items-center justify-center font-bold text-[10px] px-2 py-0.5 rounded-md shrink-0 border shadow-2xs font-sans uppercase tracking-wider"
        style={{
          backgroundColor: brand.brandColor,
          color: brand.textColor,
          borderColor: brand.brandColor,
        }}
        title={brand.displayName}
      >
        <Store className="w-3 h-3 mr-1 shrink-0" />
        <span>{brand.displayName}</span>
      </span>
    );
  }

  // If an explicit custom logoUrl (Storage URL or base64 data URL) is provided, render image directly
  if (propLogoUrl && propLogoUrl.trim() !== '' && !propLogoUrl.startsWith('/assets/retailers/')) {
    return (
      <img
        src={propLogoUrl}
        alt={alt || `${retailerName} logo`}
        className={className}
        onError={() => setHasError(true)}
        loading="lazy"
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Official Inline Vector SVGs as crisp primary/secondary rendering for ultimate speed & zero pixelation
  if (normalizedKey === 'amazon') {
    return (
      <svg className={className} viewBox="0 0 100 32" fill="none" aria-label="Amazon">
        <path fill="#232F3E" className="dark:fill-white transition-colors" d="M19.7 12.8c-1.8 0-3.1.4-3.9 1.2-.8.8-1 1.8-1 2.9 0 2.2 1.4 3.5 3.6 3.5 1.5 0 2.7-.6 3.4-1.7v1.4h3.1v-6.9c0-2.8-1.9-4.2-5.2-4.2-2.9 0-4.9 1.2-5.3 3.1l3 .5c.3-.9 1.1-1.3 2.3-1.3 1.5 0 2.2.6 2.2 1.8v.7zm-1.6 4.9c-1 0-1.8-.5-1.8-1.5 0-1 .7-1.4 2.1-1.6.8-.2 1.6-.3 2.4-.4v1.8c-.7.9-1.6 1.7-2.7 1.7zM31.2 9.2v1.5c.8-1.2 2-1.7 3.3-1.7 1.8 0 3 1 3.4 2.5.8-1.6 2.2-2.5 3.9-2.5 2.5 0 3.8 1.6 3.8 4.2v7h-3.3v-6.2c0-1.5-.6-2.2-1.8-2.2-1.2 0-2 1-2 2.4v6h-3.3v-6.2c0-1.5-.6-2.2-1.8-2.2-1.2 0-2 1-2 2.4v6h-3.3V9.2h3.1zM53.1 12.7c-3.1 0-5.1 2.2-5.1 5.3 0 3.1 2 5.3 5.1 5.3 3.1 0 5.1-2.2 5.1-5.3 0-3.1-2-5.3-5.1-5.3zm0 7.8c-1.5 0-2.4-1.2-2.4-2.5s.9-2.5 2.4-2.5 2.4 1.2 2.4 2.5-.9 2.5-2.4 2.5zM61.7 9.2v1.8h5.3l-5.6 8.3v1h9.3v-2.8h-5.3l5.6-8.3v-1h-9.3zM80.2 12.7c-3.1 0-5.1 2.2-5.1 5.3 0 3.1 2 5.3 5.1 5.3 3.1 0 5.1-2.2 5.1-5.3 0-3.1-2-5.3-5.1-5.3zm0 7.8c-1.5 0-2.4-1.2-2.4-2.5s.9-2.5 2.4-2.5 2.4 1.2 2.4 2.5-.9 2.5-2.4 2.5zM88.5 9.2v1.6c.8-1.2 2-1.8 3.5-1.8 2.2 0 3.7 1.4 3.7 3.8v7.4h-3.3v-6.6c0-1.4-.7-2.1-1.9-2.1-1.3 0-2 .9-2 2.3v6.4h-3.3V9.2h3.3z"/>
        <path fill="#FF9900" d="M92.8 26.2c-15.6 4.3-33.8 2.2-46.7-4.6-.9-.5-2 .3-1.2 1.2 13.5 13.8 33.7 9.6 49.3 1.9 1.1-.5.3-2-.1-1.8-.4.3-.9 1.1-1.3 1.3z"/>
        <path fill="#FF9900" d="M96.1 23.3c-.6-.7-3.6-.3-5.1 0-.5.1-.5.6 0 .8 1.5.9 4 1 4.7.3.5-.5.9-.8.4-1.1z"/>
      </svg>
    );
  }

  if (normalizedKey === 'meesho') {
    return (
      <svg className={className} viewBox="0 0 100 32" fill="none" aria-label="Meesho">
        <rect width="28" height="28" x="2" y="2" rx="7" fill="#F43397"/>
        <path d="M9 22V10l3.8 4.8L16.6 10v12h-2.5v-7.2l-3.3 4.2h-.4L7.1 14.8V22H9z" fill="#FFFFFF"/>
        <text x="36" y="21" fill="#F43397" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.5">meesho</text>
      </svg>
    );
  }

  if (normalizedKey === 'flipkart') {
    return (
      <svg className={className} viewBox="0 0 110 32" fill="none" aria-label="Flipkart">
        <rect width="28" height="28" x="2" y="2" rx="6" fill="#2874F0"/>
        <path d="M8 21V10h12v3.5h-7.5v2.5h6v3.5h-6V21H8z" fill="#FFE500"/>
        <path d="M16 15l4-5h-3.8l-2.7 5H16z" fill="#FFE500"/>
        <text x="36" y="21" fill="#2874F0" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" fontStyle="italic">Flipkart</text>
      </svg>
    );
  }

  if (normalizedKey === 'myntra') {
    return (
      <svg className={className} viewBox="0 0 110 32" fill="none" aria-label="Myntra">
        <path d="M4 23.5L10 8.5l5.5 10.5L21 8.5l6 15" stroke="#FF3F6C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.5 19L21 8.5" stroke="#F16522" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="32" y="22" fill="#282C3F" className="dark:fill-white transition-colors" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.3">Myntra</text>
      </svg>
    );
  }

  if (normalizedKey === 'ajio') {
    return (
      <svg className={className} viewBox="0 0 85 32" fill="none" aria-label="Ajio">
        <rect width="28" height="28" x="2" y="2" rx="6" fill="#111827"/>
        <text x="16" y="20" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="10">AJIO</text>
        <text x="36" y="21" fill="#111827" className="dark:fill-white transition-colors" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="17" letterSpacing="0.5">AJIO</text>
      </svg>
    );
  }

  if (normalizedKey === 'croma') {
    return (
      <svg className={className} viewBox="0 0 100 32" fill="none" aria-label="Croma">
        <rect width="28" height="28" x="2" y="2" rx="6" fill="#00B894"/>
        <path d="M20 11a5 5 0 1 0 0 10h3" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
        <text x="36" y="21" fill="#00B894" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="16">croma</text>
      </svg>
    );
  }

  if (normalizedKey === 'reliancedigital') {
    return (
      <svg className={className} viewBox="0 0 130 32" fill="none" aria-label="Reliance Digital">
        <rect width="28" height="28" x="2" y="2" rx="6" fill="#E11D48"/>
        <path d="M9 9h6a4 4 0 0 1 0 7H9V9zm0 7h7a4 4 0 0 1 0 7H9v-7z" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <text x="36" y="16" fill="#E11D48" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="11">RELIANCE</text>
        <text x="36" y="26" fill="#1E40AF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="10">digital</text>
      </svg>
    );
  }

  if (normalizedKey === 'tatacliq') {
    return (
      <svg className={className} viewBox="0 0 120 32" fill="none" aria-label="Tata CLiQ">
        <rect width="28" height="28" x="2" y="2" rx="6" fill="#881337"/>
        <circle cx="16" cy="16" r="7" stroke="#00E5FF" strokeWidth="3" fill="none"/>
        <text x="36" y="16" fill="#881337" className="dark:fill-pink-400" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="10">TATA</text>
        <text x="36" y="26" fill="#881337" className="dark:fill-pink-400" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="12">CLiQ</text>
      </svg>
    );
  }

  if (normalizedKey === 'nykaa') {
    return (
      <svg className={className} viewBox="0 0 100 32" fill="none" aria-label="Nykaa">
        <rect width="28" height="28" x="2" y="2" rx="6" fill="#FC2779"/>
        <text x="16" y="20" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="13">N</text>
        <text x="36" y="21" fill="#FC2779" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" letterSpacing="0.5">NYKAA</text>
      </svg>
    );
  }

  if (normalizedKey === 'snapdeal') {
    return (
      <svg className={className} viewBox="0 0 110 32" fill="none" aria-label="Snapdeal">
        <rect width="28" height="28" x="2" y="2" rx="6" fill="#E40046"/>
        <path d="M10 10h12v4H14v4h8v4H10z" fill="#FFFFFF"/>
        <text x="36" y="21" fill="#E40046" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="15">snapdeal</text>
      </svg>
    );
  }

  // Generic or newly added future retailer fallback image referencing local public asset
  return (
    <img
      src={resolvedLogoUrl}
      alt={alt || `${brand.displayName} logo`}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
