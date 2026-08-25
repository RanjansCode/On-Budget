/**
 * Retailer Logo Mapping & Master Retailer Registry Utilities
 * Master Retailer Registry is the single source of truth for all retailer names and logos.
 */

import { Retailer } from '../types';
import { INITIAL_RETAILERS } from '../data';

export interface RetailerBrandConfig {
  key: string;
  displayName: string;
  brandColor: string;
  textColor: string;
  borderColor: string;
}

// In-memory Master Retailers registry loaded from Firestore / INITIAL_RETAILERS
const DYNAMIC_RETAILERS_REGISTRY: Map<string, Retailer> = new Map();

/**
 * Normalizes any retailer name or ID string to a clean alphanumeric slug key
 */
export function normalizeRetailerKey(retailerNameOrId: string): string {
  if (!retailerNameOrId) return '';
  return retailerNameOrId.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Registers Master Retailers from Firestore into the active in-memory registry.
 */
export function registerMasterRetailers(retailersList: Retailer[]): void {
  DYNAMIC_RETAILERS_REGISTRY.clear();

  // 1. Seed base initial retailers first
  INITIAL_RETAILERS.forEach(r => {
    if (r && r.id) {
      const cleanId = r.id.toLowerCase().trim();
      DYNAMIC_RETAILERS_REGISTRY.set(cleanId, r);
      if (r.name) {
        DYNAMIC_RETAILERS_REGISTRY.set(r.name.toLowerCase().trim(), r);
        const norm = normalizeRetailerKey(r.name);
        if (norm) DYNAMIC_RETAILERS_REGISTRY.set(norm, r);
      }
    }
  });

  // 2. Overlay live Firestore master retailers
  if (Array.isArray(retailersList) && retailersList.length > 0) {
    retailersList.forEach(r => {
      if (r && r.id) {
        const cleanId = r.id.toLowerCase().trim();
        DYNAMIC_RETAILERS_REGISTRY.set(cleanId, r);
        if (r.name) {
          DYNAMIC_RETAILERS_REGISTRY.set(r.name.toLowerCase().trim(), r);
          const norm = normalizeRetailerKey(r.name);
          if (norm) DYNAMIC_RETAILERS_REGISTRY.set(norm, r);
        }
      }
    });
  }
}

// Initialize on module load
registerMasterRetailers(INITIAL_RETAILERS);

/**
 * Looks up a retailer from the Master Retailer Registry by id or name.
 */
export function getMasterRetailer(retailerIdOrName?: string): Retailer | undefined {
  if (!retailerIdOrName) return undefined;
  const raw = retailerIdOrName.trim();
  const lower = raw.toLowerCase();
  const norm = normalizeRetailerKey(raw);

  if (DYNAMIC_RETAILERS_REGISTRY.has(lower)) {
    return DYNAMIC_RETAILERS_REGISTRY.get(lower);
  }
  if (norm && DYNAMIC_RETAILERS_REGISTRY.has(norm)) {
    return DYNAMIC_RETAILERS_REGISTRY.get(norm);
  }

  // Linear scan fallback
  for (const r of DYNAMIC_RETAILERS_REGISTRY.values()) {
    if (
      r.id.toLowerCase() === lower ||
      r.name.toLowerCase() === lower ||
      normalizeRetailerKey(r.id) === norm ||
      normalizeRetailerKey(r.name) === norm
    ) {
      return r;
    }
  }

  return undefined;
}

/**
 * Resolves the official logo URL from Master Retailer Registry.
 * If customLogoUrl is provided (e.g. preview in edit modal), returns that.
 */
export function getRetailerLogoUrl(retailerNameOrId?: string, customLogoUrl?: string): string | undefined {
  if (customLogoUrl && customLogoUrl.trim() !== '') {
    return customLogoUrl;
  }
  if (!retailerNameOrId) return undefined;
  const master = getMasterRetailer(retailerNameOrId);
  if (master && master.logoUrl && master.logoUrl.trim() !== '') {
    return master.logoUrl;
  }
  return undefined;
}

/**
 * Gets brand styling information for a retailer name or ID.
 */
export function getRetailerBrandConfig(retailerName: string): RetailerBrandConfig {
  const master = getMasterRetailer(retailerName);
  const clean = master?.name || (retailerName || 'Store').trim();
  const key = normalizeRetailerKey(clean);

  const COLOR_MAP: Record<string, { brandColor: string; textColor: string; borderColor: string }> = {
    amazon: { brandColor: '#232F3E', textColor: '#FF9900', borderColor: '#FF9900/30' },
    meesho: { brandColor: '#F43397', textColor: '#FFFFFF', borderColor: '#F43397/40' },
    flipkart: { brandColor: '#2874F0', textColor: '#FFE500', borderColor: '#2874F0/40' },
    shopsy: { brandColor: '#E51075', textColor: '#FFFFFF', borderColor: '#E51075/40' },
    myntra: { brandColor: '#FF3F6C', textColor: '#FFFFFF', borderColor: '#FF3F6C/40' },
    ajio: { brandColor: '#111827', textColor: '#FFFFFF', borderColor: '#374151' },
    croma: { brandColor: '#00B894', textColor: '#FFFFFF', borderColor: '#00B894/40' },
    reliancedigital: { brandColor: '#E11D48', textColor: '#FFFFFF', borderColor: '#E11D48/40' },
    tatacliq: { brandColor: '#881337', textColor: '#00E5FF', borderColor: '#881337/40' },
    nykaa: { brandColor: '#FC2779', textColor: '#FFFFFF', borderColor: '#FC2779/40' },
    snapdeal: { brandColor: '#E40046', textColor: '#FFFFFF', borderColor: '#E40046/40' },
  };

  const colors = COLOR_MAP[key] || {
    brandColor: '#FF5A00',
    textColor: '#FFFFFF',
    borderColor: '#FF5A00/40',
  };

  return {
    key,
    displayName: clean,
    ...colors,
  };
}

