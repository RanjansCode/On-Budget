import React, { useState } from 'react';
import { Store } from 'lucide-react';
import { getMasterRetailer, getRetailerLogoUrl, getRetailerBrandConfig } from '../utils/retailerLogos';

interface RetailerLogoProps {
  retailerName?: string;
  retailerId?: string;
  logoUrl?: string;
  className?: string;
  iconOnly?: boolean;
  alt?: string;
}

/**
 * Reusable Master Retailer Logo Component
 * Single Source of Truth: Master Retailer Platform Registry
 * Always dynamically renders the retailer's official logo saved in Master Registry.
 * Uses object-fit: contain to prevent stretching/cropping.
 * Provides a graceful, accessible fallback store badge if the image fails to load.
 */
export default function RetailerLogo({
  retailerName = '',
  retailerId = '',
  logoUrl: propLogoUrl,
  className = 'h-6 w-auto object-contain shrink-0',
  iconOnly = false,
  alt,
}: RetailerLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  // Look up master retailer from the authoritative registry
  const master = getMasterRetailer(retailerId || retailerName);
  const displayName = master?.name || (retailerName || 'Store').trim();
  const brand = getRetailerBrandConfig(displayName);
  const localSvgFallback = `/assets/retailers/${brand.key}.svg`;

  // Authoritative logo URL from Master Retailer Registry (or explicit prop if provided for modal previews)
  const initialLogoUrl = propLogoUrl || master?.logoUrl || getRetailerLogoUrl(retailerId || retailerName) || localSvgFallback;
  const resolvedLogoUrl = triedFallback ? localSvgFallback : initialLogoUrl;

  // If image failed after trying local fallback, render graceful fallback store badge
  if (hasError || !resolvedLogoUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold text-[10px] px-2 py-0.5 rounded-md shrink-0 border shadow-2xs font-sans uppercase tracking-wider ${
          iconOnly ? 'w-6 h-6 p-0' : ''
        }`}
        style={{
          backgroundColor: brand.brandColor,
          color: brand.textColor,
          borderColor: brand.brandColor,
        }}
        title={displayName}
      >
        <Store className="w-3 h-3 shrink-0" />
        {!iconOnly && <span className="ml-1 truncate max-w-[80px]">{displayName}</span>}
      </span>
    );
  }

  // Render official logo from Master Retailer Registry with object-fit: contain
  return (
    <img
      src={resolvedLogoUrl}
      alt={alt || `${displayName} logo`}
      className={`${className} object-contain`}
      onError={() => {
        if (!triedFallback && resolvedLogoUrl !== localSvgFallback) {
          setTriedFallback(true);
        } else {
          setHasError(true);
        }
      }}
      loading="lazy"
      style={{ objectFit: 'contain' }}
    />
  );
}

