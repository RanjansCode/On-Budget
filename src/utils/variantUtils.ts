import { Product, ProductVariant, ProductVariantOption, VariantStockStatus } from '../types';
import { calculateDiscountPercent } from './retailerOffers';
import { getProductImages } from './imageUtils';

/**
 * Computes Cartesian product of variant options to generate all possible combinations.
 * Preserves existing variant prices, images, SKUs, and settings when matching option keys are found.
 */
export function generateVariantCombinations(
  options: ProductVariantOption[],
  existingVariants: ProductVariant[] = []
): ProductVariant[] {
  // Filter valid options with non-empty trimmed values
  const validOptions = options
    .map(opt => ({
      ...opt,
      name: opt.name.trim(),
      values: (opt.values || []).map(v => v.trim()).filter(Boolean),
    }))
    .filter(opt => opt.name.length > 0 && opt.values.length > 0);

  if (validOptions.length === 0) return [];

  // Helper for Cartesian product
  function cartesian(arr: { name: string; values: string[] }[]): Record<string, string>[] {
    return arr.reduce<Record<string, string>[]>(
      (acc, curr) => {
        const result: Record<string, string>[] = [];
        acc.forEach(prev => {
          curr.values.forEach(val => {
            result.push({ ...prev, [curr.name]: val });
          });
        });
        return result;
      },
      [{}]
    );
  }

  const combinations = cartesian(validOptions);

  return combinations.map((combo, idx) => {
    // Generate a consistent deterministic slug/key for comparison
    const comboKey = Object.entries(combo)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k.toLowerCase()}:${v.toLowerCase()}`)
      .join('|');

    // Find existing variant with identical options
    const existing = existingVariants.find(v => {
      if (!v.options) return false;
      const vKey = Object.entries(v.options)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, val]) => `${k.toLowerCase()}:${val.toLowerCase()}`)
        .join('|');
      return vKey === comboKey;
    });

    if (existing) {
      return {
        ...existing,
        options: combo, // Update with clean casing
      };
    }

    // Generate readable default ID & SKU
    const slugParts = Object.values(combo)
      .map(v => v.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .join('-');

    return {
      id: `var-${Date.now()}-${idx}-${slugParts}`,
      sku: '',
      options: combo,
      price: undefined,
      originalPrice: undefined,
      discount: undefined,
      affiliateUrl: '',
      images: [],
      stockStatus: 'in_stock' as VariantStockStatus,
      isActive: true,
    };
  });
}

/**
 * Finds the variant that matches the currently selected options dictionary.
 */
export function findMatchingVariant(
  variants: ProductVariant[] | undefined | null,
  selectedOptions: Record<string, string>
): ProductVariant | null {
  if (!variants || variants.length === 0) return null;

  const selectedEntries = Object.entries(selectedOptions).filter(([_, v]) => Boolean(v));
  if (selectedEntries.length === 0) return variants[0] || null;

  // Exact match
  const exactMatch = variants.find(variant => {
    if (!variant.options) return false;
    return selectedEntries.every(([key, val]) => {
      const variantVal = variant.options[key];
      return variantVal && variantVal.toLowerCase() === val.toLowerCase();
    });
  });

  return exactMatch || null;
}

/**
 * Intelligent Amazon-style availability check:
 * Given current selection (e.g. Color = Black), checks if an option value (e.g. Size = XL)
 * has a valid, active combination.
 */
export function checkOptionAvailability(
  variants: ProductVariant[] | undefined | null,
  currentSelection: Record<string, string>,
  targetOptionName: string,
  targetOptionValue: string
): {
  exists: boolean;
  isActive: boolean;
  isInStock: boolean;
  stockStatus: VariantStockStatus;
  matchingVariant?: ProductVariant;
} {
  if (!variants || variants.length === 0) {
    return { exists: true, isActive: true, isInStock: true, stockStatus: 'in_stock' };
  }

  // Hypothetical selection if user picks targetOptionValue
  const hypotheticalSelection = {
    ...currentSelection,
    [targetOptionName]: targetOptionValue,
  };

  // 1. Try to find an exact combination matching hypothetical selection
  const exact = variants.find(variant => {
    if (!variant.options) return false;
    return Object.entries(hypotheticalSelection).every(([k, v]) => {
      if (!v) return true;
      const val = variant.options[k];
      return val && val.toLowerCase() === v.toLowerCase();
    });
  });

  if (exact) {
    const isActive = exact.isActive !== false;
    const stockStatus = exact.stockStatus || 'in_stock';
    const isInStock = isActive && stockStatus !== 'out_of_stock' && stockStatus !== 'unavailable';
    return {
      exists: true,
      isActive,
      isInStock,
      stockStatus,
      matchingVariant: exact,
    };
  }

  // 2. If no exact match with full currentSelection, check if the option value exists at all in any active combination
  const anyWithVal = variants.find(variant => {
    if (!variant.options) return false;
    const val = variant.options[targetOptionName];
    return val && val.toLowerCase() === targetOptionValue.toLowerCase();
  });

  if (anyWithVal) {
    const isActive = anyWithVal.isActive !== false;
    const stockStatus = anyWithVal.stockStatus || 'in_stock';
    const isInStock = isActive && stockStatus !== 'out_of_stock' && stockStatus !== 'unavailable';
    return {
      exists: false, // Does not exist with current partial selection, but exists in other combinations
      isActive,
      isInStock,
      stockStatus,
      matchingVariant: anyWithVal,
    };
  }

  return {
    exists: false,
    isActive: false,
    isInStock: false,
    stockStatus: 'unavailable',
  };
}

/**
 * Returns human-readable label for a variant combination (e.g. "Midnight Black / 256GB / Large")
 */
export function getVariantDisplayName(
  variantOrOptions?: ProductVariant | Record<string, string> | null,
  includeOptionKeys = false
): string {
  if (!variantOrOptions) return '';
  const options = (variantOrOptions as ProductVariant).options || (variantOrOptions as Record<string, string>);
  if (!options || typeof options !== 'object') return '';

  return Object.entries(options)
    .map(([k, v]) => (includeOptionKeys ? `${k}: ${v}` : v))
    .join(' / ');
}

export interface EffectiveProductData {
  price: number;
  originalPrice: number;
  discount: number;
  hasDiscount: boolean;
  images: string[];
  mainImage: string;
  affiliateUrl: string;
  stockStatus: VariantStockStatus;
  isAvailable: boolean;
  sku?: string;
  selectedVariant: ProductVariant | null;
  displayName: string;
}

/**
 * Derives the effective product view data (price, images, stock, links) based on selected variant
 * with comprehensive, safe fallbacks to product-level data.
 */
export function getEffectiveProductData(
  product?: Partial<Product> | null,
  selectedVariant?: ProductVariant | null
): EffectiveProductData {
  const baseOriginal = Number(product?.originalPrice) || Number(product?.price) || 0;
  const basePrice = Number(product?.price) || 0;
  const baseImages = getProductImages(product);

  const baseAffiliateUrl =
    (product?.retailerOffers && product.retailerOffers[0]?.productUrl) ||
    (product?.purchaseLinks && product.purchaseLinks[0]?.url) ||
    (product?.affiliateLinks && product.affiliateLinks[0]?.url) ||
    '';

  if (!selectedVariant) {
    const computedDiscount = calculateDiscountPercent(baseOriginal, basePrice) || Number(product?.discount) || 0;
    return {
      price: basePrice,
      originalPrice: baseOriginal,
      discount: computedDiscount,
      hasDiscount: computedDiscount > 0 && baseOriginal > basePrice,
      images: baseImages,
      mainImage: baseImages[0] || '',
      affiliateUrl: baseAffiliateUrl,
      stockStatus: 'in_stock',
      isAvailable: true,
      sku: undefined,
      selectedVariant: null,
      displayName: '',
    };
  }

  // Variant specific resolution
  const variantPrice = typeof selectedVariant.price === 'number' && selectedVariant.price > 0
    ? selectedVariant.price
    : basePrice;

  const variantOriginal = typeof selectedVariant.originalPrice === 'number' && selectedVariant.originalPrice > 0
    ? selectedVariant.originalPrice
    : baseOriginal > variantPrice ? baseOriginal : variantPrice;

  const computedDiscount = calculateDiscountPercent(variantOriginal, variantPrice) ||
    (typeof selectedVariant.discount === 'number' ? selectedVariant.discount : calculateDiscountPercent(baseOriginal, basePrice));

  const variantImages = Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
    ? selectedVariant.images.filter(img => typeof img === 'string' && img.trim().length > 0)
    : baseImages;

  const finalImages = variantImages.length > 0 ? variantImages : baseImages;
  const variantAffiliateUrl = selectedVariant.affiliateUrl && selectedVariant.affiliateUrl.trim().length > 0
    ? selectedVariant.affiliateUrl.trim()
    : baseAffiliateUrl;

  const stockStatus = selectedVariant.stockStatus || 'in_stock';
  const isAvailable = selectedVariant.isActive !== false && stockStatus !== 'out_of_stock' && stockStatus !== 'unavailable';

  return {
    price: variantPrice,
    originalPrice: variantOriginal,
    discount: computedDiscount,
    hasDiscount: computedDiscount > 0 && variantOriginal > variantPrice,
    images: finalImages,
    mainImage: finalImages[0] || baseImages[0] || '',
    affiliateUrl: variantAffiliateUrl,
    stockStatus,
    isAvailable,
    sku: selectedVariant.sku,
    selectedVariant,
    displayName: getVariantDisplayName(selectedVariant),
  };
}

/**
 * Calculates price range across variants for display in product cards and listings.
 */
export function getProductPriceRange(product?: Partial<Product> | null): {
  minPrice: number;
  maxPrice: number;
  hasPriceRange: boolean;
  minOriginalPrice: number;
  maxDiscount: number;
  totalVariantsCount: number;
  activeVariantsCount: number;
} {
  const basePrice = Number(product?.price) || 0;
  const baseOrig = Number(product?.originalPrice) || basePrice;
  const baseDisc = calculateDiscountPercent(baseOrig, basePrice);

  if (!product?.hasVariants || !Array.isArray(product?.variants) || product.variants.length === 0) {
    return {
      minPrice: basePrice,
      maxPrice: basePrice,
      hasPriceRange: false,
      minOriginalPrice: baseOrig,
      maxDiscount: baseDisc,
      totalVariantsCount: 0,
      activeVariantsCount: 0,
    };
  }

  const activeVariants = product.variants.filter(v => v.isActive !== false);
  if (activeVariants.length === 0) {
    return {
      minPrice: basePrice,
      maxPrice: basePrice,
      hasPriceRange: false,
      minOriginalPrice: baseOrig,
      maxDiscount: baseDisc,
      totalVariantsCount: product.variants.length,
      activeVariantsCount: 0,
    };
  }

  const prices: number[] = [];
  const origPrices: number[] = [];
  const discounts: number[] = [];

  activeVariants.forEach(v => {
    const cur = typeof v.price === 'number' && v.price > 0 ? v.price : basePrice;
    const orig = typeof v.originalPrice === 'number' && v.originalPrice > 0 ? v.originalPrice : (baseOrig > cur ? baseOrig : cur);
    const disc = calculateDiscountPercent(orig, cur);
    prices.push(cur);
    origPrices.push(orig);
    discounts.push(disc);
  });

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minOriginalPrice = Math.min(...origPrices);
  const maxDiscount = Math.max(...discounts, baseDisc);

  return {
    minPrice,
    maxPrice,
    hasPriceRange: minPrice !== maxPrice && minPrice > 0 && maxPrice > 0,
    minOriginalPrice,
    maxDiscount,
    totalVariantsCount: product.variants.length,
    activeVariantsCount: activeVariants.length,
  };
}

/**
 * Common color name to hex/css color helper for visual color chips.
 */
export function getColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const clean = colorName.toLowerCase().trim();

  const colorMap: Record<string, string> = {
    black: '#171717',
    'matte black': '#222222',
    'space gray': '#4B4846',
    'space grey': '#4B4846',
    gray: '#6B7280',
    grey: '#6B7280',
    silver: '#D1D5DB',
    white: '#FFFFFF',
    'off white': '#F5F5F0',
    red: '#EF4444',
    crimson: '#DC2626',
    blue: '#3B82F6',
    'navy blue': '#1E3A8A',
    navy: '#1E3A8A',
    'sky blue': '#38BDF8',
    green: '#10B981',
    'forest green': '#065F46',
    olive: '#65A30D',
    yellow: '#F59E0B',
    gold: '#D97706',
    rose: '#F43F5E',
    'rose gold': '#B76E79',
    pink: '#EC4899',
    purple: '#8B5CF6',
    violet: '#7C3AED',
    orange: '#F97316',
    brown: '#78350F',
    beige: '#D4C4B5',
    teal: '#14B8A6',
    cyan: '#06B6D4',
  };

  return colorMap[clean] || null;
}
