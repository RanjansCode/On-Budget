import React from 'react';
import { ShoppingBag, Globe, Store, ExternalLink } from 'lucide-react';

interface PlatformLogoProps {
  platformName: string;
  className?: string;
  iconOnly?: boolean;
}

export default function PlatformLogo({ platformName, className = 'w-5 h-5', iconOnly = false }: PlatformLogoProps) {
  const normName = (platformName || '').toLowerCase().trim();

  // Amazon Logo SVG
  if (normName.includes('amazon')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.9 11.2c-1.3.3-2.7.5-3.8.7-2.3.5-3.3 1.5-3.3 3.1 0 1.9 1.4 3 3.4 3 1.8 0 3.2-.8 3.9-2.2h.1v1.9h2.9v-7.3c0-2.8-1.7-4.2-4.8-4.2-2.7 0-4.6 1.1-5 2.8l2.7.4c.3-.9 1.2-1.4 2.4-1.4 1.4 0 2.1.6 2.1 1.8v1.4zm-1.8 4.4c-.6.9-1.5 1.3-2.5 1.3-1 0-1.7-.5-1.7-1.4 0-.9.6-1.4 2-1.7.8-.2 1.5-.3 2.2-.4v2.2z" />
        <path d="M19.7 18.2C15.8 20.8 10 21.8 5.2 20c-.8-.3-1.6.5-.9 1.1 5.3 4.2 12.5 3.3 17.2-.2.6-.5.1-1.3-.8-1.2z" className="text-[#FF9900]" />
        <path d="M21.2 17.1c-.4-.5-2.2-.2-3.1 0-.3.1-.3.3 0 .5.9.6 2.4.5 2.8.1.3-.3.6-.5.3-.6z" className="text-[#FF9900]" />
      </svg>
    );
  }

  // Flipkart Logo SVG
  if (normName.includes('flipkart')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#2874F0" />
        <path d="M6 17V7h12v3H10v2h7v3H10v2H6z" fill="#FFE500" />
        <path d="M14.5 11.5L18 7h-3.5L11 11.5h3.5z" fill="#FFE500" />
      </svg>
    );
  }

  // Meesho Logo SVG
  if (normName.includes('meesho')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#F43397" />
        <path d="M6 18V6l4 5 4-5v12h-2.5v-7L9.5 14 7.5 11v7H6z" fill="#FFFFFF" />
      </svg>
    );
  }

  // Myntra Logo SVG
  if (normName.includes('myntra')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M4 17.5L8 6.5l3.5 7.5L15 6.5l5 11" stroke="#FF3F6C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.5 14L15 6.5" stroke="#F16522" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Ajio Logo SVG
  if (normName.includes('ajio')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#111827" />
        <text x="12" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">AJIO</text>
      </svg>
    );
  }

  // Croma Logo SVG
  if (normName.includes('croma')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#00B894" />
        <path d="M16 8a4 4 0 100 8h2" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Reliance Digital Logo SVG
  if (normName.includes('reliance') || normName.includes('digital')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#E11D48" />
        <path d="M7 6h6a3 3 0 010 6H7V6zm0 6h7a3 3 0 010 6H7v-6z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Tata CliQ Logo SVG
  if (normName.includes('tata') || normName.includes('cliq')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#881337" />
        <circle cx="12" cy="12" r="6" stroke="#00E5FF" strokeWidth="2.5" />
      </svg>
    );
  }

  // Nykaa Logo SVG
  if (normName.includes('nykaa')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FC2779" />
        <text x="12" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif">N</text>
      </svg>
    );
  }

  // Official / Brand Website
  if (normName.includes('official') || normName.includes('website') || normName.includes('brand')) {
    return <Globe className={`${className} text-[#FF5A00]`} />;
  }

  // Default fallback icon
  return <ShoppingBag className={`${className} text-[#FF5A00]`} />;
}
