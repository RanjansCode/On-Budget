import React from 'react';
import RetailerLogo from './RetailerLogo';
import { Globe } from 'lucide-react';

interface PlatformLogoProps {
  platformName?: string;
  retailerId?: string;
  logoUrl?: string;
  className?: string;
  iconOnly?: boolean;
}

/**
 * Platform/Retailer Logo Renderer
 * Resolves directly from Master Retailer Registry.
 */
export default function PlatformLogo({
  platformName = '',
  retailerId,
  logoUrl,
  className = 'h-6 w-auto shrink-0',
  iconOnly = false,
}: PlatformLogoProps) {
  const normName = (platformName || '').toLowerCase().trim();

  // Official / Website / Brand URL generic fallback
  if (normName.includes('official') || normName.includes('website') || normName.includes('brand link')) {
    return <Globe className={`${className} text-[#FF5A00] shrink-0`} />;
  }

  // Delegate directly to RetailerLogo which connects to Master Retailer Registry
  return (
    <RetailerLogo
      retailerName={platformName}
      retailerId={retailerId}
      logoUrl={logoUrl}
      className={className}
      iconOnly={iconOnly}
    />
  );
}
