import React from 'react';
import RetailerLogo from './RetailerLogo';
import { ShoppingBag, Globe, Store } from 'lucide-react';
import { normalizeRetailerKey, getRetailerBrandConfig } from '../utils/retailerLogos';

interface PlatformLogoProps {
  platformName: string;
  logoUrl?: string;
  className?: string;
  iconOnly?: boolean;
}

/**
 * Platform/Retailer Logo Renderer
 * Renders official brand logos (Amazon, Meesho, Flipkart, Myntra, Ajio, Croma, etc.)
 */
export default function PlatformLogo({
  platformName,
  logoUrl,
  className = 'h-6 w-auto shrink-0',
  iconOnly = false,
}: PlatformLogoProps) {
  const normName = (platformName || '').toLowerCase().trim();
  const key = normalizeRetailerKey(platformName);
  const brand = getRetailerBrandConfig(platformName);

  // Official / Website / Brand URL generic fallback
  if (normName.includes('official') || normName.includes('website') || normName.includes('brand link')) {
    return <Globe className={`${className} text-[#FF5A00]`} />;
  }

  // If explicitly requested as square icon box (e.g., in tight table cells or admin headers)
  if (iconOnly) {
    if (key === 'amazon') {
      return (
        <div className="w-6 h-6 bg-[#232F3E] rounded-md flex items-center justify-center shrink-0 border border-[#FF9900]/30 shadow-2xs">
          <svg className="w-4 h-4 text-[#FF9900]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.9 11.2c-1.3.3-2.7.5-3.8.7-2.3.5-3.3 1.5-3.3 3.1 0 1.9 1.4 3 3.4 3 1.8 0 3.2-.8 3.9-2.2h.1v1.9h2.9v-7.3c0-2.8-1.7-4.2-4.8-4.2-2.7 0-4.6 1.1-5 2.8l2.7.4c.3-.9 1.2-1.4 2.4-1.4 1.4 0 2.1.6 2.1 1.8v1.4zm-1.8 4.4c-.6.9-1.5 1.3-2.5 1.3-1 0-1.7-.5-1.7-1.4 0-.9.6-1.4 2-1.7.8-.2 1.5-.3 2.2-.4v2.2z" />
            <path d="M19.7 18.2C15.8 20.8 10 21.8 5.2 20c-.8-.3-1.6.5-.9 1.1 5.3 4.2 12.5 3.3 17.2-.2.6-.5.1-1.3-.8-1.2z" />
          </svg>
        </div>
      );
    }
    if (key === 'meesho') {
      return (
        <div className="w-6 h-6 bg-[#F43397] rounded-md flex items-center justify-center shrink-0 text-white font-black text-[11px] shadow-2xs font-sans">
          m
        </div>
      );
    }
    if (key === 'flipkart') {
      return (
        <div className="w-6 h-6 bg-[#2874F0] rounded-md flex items-center justify-center shrink-0 text-[#FFE500] font-black text-[11px] italic shadow-2xs">
          F
        </div>
      );
    }
    if (key === 'myntra') {
      return (
        <div className="w-6 h-6 bg-white border border-pink-200 rounded-md flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M4 17.5L8 6.5l3.5 7.5L15 6.5l5 11" stroke="#FF3F6C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.5 14L15 6.5" stroke="#F16522" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    }
  }

  // Delegate to RetailerLogo component
  return (
    <RetailerLogo
      retailerName={platformName}
      logoUrl={logoUrl}
      className={className}
      iconOnly={iconOnly}
    />
  );
}
