/**
 * Retailer Logo Mapping & Utilities
 * Provides stable local asset paths, dynamic Firestore master retailer registration,
 * and brand color configurations for all supported retailers.
 */

import { Retailer } from '../types';

export interface RetailerBrandConfig {
  key: string;
  displayName: string;
  assetPath: string;
  brandColor: string;
  textColor: string;
  borderColor: string;
}

const RETAILER_CONFIGS: Record<string, RetailerBrandConfig> = {
  amazon: {
    key: 'amazon',
    displayName: 'Amazon',
    assetPath: '/assets/retailers/amazon.svg',
    brandColor: '#232F3E',
    textColor: '#FF9900',
    borderColor: '#FF9900/30',
  },
  meesho: {
    key: 'meesho',
    displayName: 'Meesho',
    assetPath: '/assets/retailers/meesho.svg',
    brandColor: '#F43397',
    textColor: '#FFFFFF',
    borderColor: '#F43397/40',
  },
  flipkart: {
    key: 'flipkart',
    displayName: 'Flipkart',
    assetPath: '/assets/retailers/flipkart.svg',
    brandColor: '#2874F0',
    textColor: '#FFE500',
    borderColor: '#2874F0/40',
  },
  myntra: {
    key: 'myntra',
    displayName: 'Myntra',
    assetPath: '/assets/retailers/myntra.svg',
    brandColor: '#FF3F6C',
    textColor: '#FFFFFF',
    borderColor: '#FF3F6C/40',
  },
  ajio: {
    key: 'ajio',
    displayName: 'Ajio',
    assetPath: '/assets/retailers/ajio.svg',
    brandColor: '#111827',
    textColor: '#FFFFFF',
    borderColor: '#374151',
  },
  croma: {
    key: 'croma',
    displayName: 'Croma',
    assetPath: '/assets/retailers/croma.svg',
    brandColor: '#00B894',
    textColor: '#FFFFFF',
    borderColor: '#00B894/40',
  },
  reliancedigital: {
    key: 'reliancedigital',
    displayName: 'Reliance Digital',
    assetPath: '/assets/retailers/reliancedigital.svg',
    brandColor: '#E11D48',
    textColor: '#FFFFFF',
    borderColor: '#E11D48/40',
  },
  tatacliq: {
    key: 'tatacliq',
    displayName: 'Tata CLiQ',
    assetPath: '/assets/retailers/tatacliq.svg',
    brandColor: '#881337',
    textColor: '#00E5FF',
    borderColor: '#881337/40',
  },
  nykaa: {
    key: 'nykaa',
    displayName: 'Nykaa',
    assetPath: '/assets/retailers/nykaa.svg',
    brandColor: '#FC2779',
    textColor: '#FFFFFF',
    borderColor: '#FC2779/40',
  },
  snapdeal: {
    key: 'snapdeal',
    displayName: 'Snapdeal',
    assetPath: '/assets/retailers/snapdeal.svg',
    brandColor: '#E40046',
    textColor: '#FFFFFF',
    borderColor: '#E40046/40',
  },
};

// In-memory master retailers map from Firestore
let DYNAMIC_RETAILERS_REGISTRY: Map<string, Retailer> = new Map();

export function registerMasterRetailers(retailersList: Retailer[]): void {
  DYNAMIC_RETAILERS_REGISTRY.clear();
  if (Array.isArray(retailersList)) {
    retailersList.forEach(r => {
      if (r && r.id) {
        DYNAMIC_RETAILERS_REGISTRY.set(r.id.toLowerCase(), r);
        if (r.name) {
          DYNAMIC_RETAILERS_REGISTRY.set(r.name.toLowerCase().replace(/[^a-z0-9]/g, ''), r);
        }
      }
    });
  }
}

/**
 * Normalizes any retailer name string to match key standards.
 */
export function normalizeRetailerKey(retailerName: string): string {
  if (!retailerName) return 'default';
  const clean = retailerName.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  if (clean.includes('amazon')) return 'amazon';
  if (clean.includes('meesho')) return 'meesho';
  if (clean.includes('flipkart')) return 'flipkart';
  if (clean.includes('myntra')) return 'myntra';
  if (clean.includes('ajio')) return 'ajio';
  if (clean.includes('croma')) return 'croma';
  if (clean.includes('reliance') || clean.includes('digital')) return 'reliancedigital';
  if (clean.includes('tata') || clean.includes('cliq')) return 'tatacliq';
  if (clean.includes('nykaa')) return 'nykaa';
  if (clean.includes('snapdeal')) return 'snapdeal';

  return clean || 'default';
}

/**
 * Gets the logo URL for a retailer, preferring explicit custom logoUrl,
 * then master database retailer logoUrl, then local fallback SVG asset.
 */
export function getRetailerLogoUrl(retailerNameOrId: string, customLogoUrl?: string): string {
  if (customLogoUrl && customLogoUrl.trim() !== '') {
    return customLogoUrl;
  }

  if (!retailerNameOrId) return '/assets/retailers/default.svg';

  const cleanKey = retailerNameOrId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (DYNAMIC_RETAILERS_REGISTRY.has(cleanKey)) {
    const matched = DYNAMIC_RETAILERS_REGISTRY.get(cleanKey);
    if (matched?.logoUrl) {
      return matched.logoUrl;
    }
  }

  const normalized = normalizeRetailerKey(retailerNameOrId);
  if (RETAILER_CONFIGS[normalized]) {
    return RETAILER_CONFIGS[normalized].assetPath;
  }

  return '/assets/retailers/default.svg';
}

/**
 * Gets brand styling information for a retailer name.
 */
export function getRetailerBrandConfig(retailerName: string): RetailerBrandConfig {
  const key = normalizeRetailerKey(retailerName);
  if (RETAILER_CONFIGS[key]) {
    return RETAILER_CONFIGS[key];
  }

  // Dynamic fallback for any unlisted or custom future retailer
  const clean = (retailerName || 'Store').trim();
  return {
    key: normalizeRetailerKey(clean),
    displayName: clean,
    assetPath: '/assets/retailers/default.svg',
    brandColor: '#FF5A00',
    textColor: '#FFFFFF',
    borderColor: '#FF5A00/40',
  };
}
