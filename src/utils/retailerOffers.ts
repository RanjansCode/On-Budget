import { Product, RetailerOffer } from '../types';

/**
 * Calculates discount percentage safely based on original price (MRP) and offer price.
 */
export function calculateDiscountPercent(originalPrice: number, offerPrice: number): number {
  if (!originalPrice || originalPrice <= 0 || !offerPrice || offerPrice <= 0) return 0;
  if (originalPrice <= offerPrice) return 0;
  const rawDiscount = ((originalPrice - offerPrice) / originalPrice) * 100;
  return Math.min(99, Math.max(0, Math.round(rawDiscount)));
}

/**
 * Returns a normalized array of RetailerOffer objects for any Product.
 * Handles backward compatibility seamlessly for legacy products that only have
 * single price/originalPrice or purchaseLinks/affiliateLinks.
 */
export function getNormalizedRetailerOffers(
  product?: Partial<Product> | null,
  includeInactive = false
): RetailerOffer[] {
  if (!product) return [];

  // 1. If explicit retailerOffers array exists and is non-empty
  if (Array.isArray(product.retailerOffers) && product.retailerOffers.length > 0) {
    let offers = product.retailerOffers.map((offer, idx) => {
      const orig = Number(offer.originalPrice) || Number(offer.offerPrice) || Number(product.originalPrice) || Number(product.price) || 0;
      const cur = Number(offer.offerPrice) || Number(product.price) || 0;
      const computedDiscount = calculateDiscountPercent(orig, cur);

      return {
        id: offer.id || `offer-${idx}-${Date.now()}`,
        retailerName: (offer.retailerName || 'Retailer').trim(),
        productUrl: (offer.productUrl || '').trim(),
        originalPrice: orig,
        offerPrice: cur,
        discountPercent: computedDiscount,
        isActive: offer.isActive !== false, // default true
        displayOrder: typeof offer.displayOrder === 'number' ? offer.displayOrder : idx,
      };
    });

    if (!includeInactive) {
      offers = offers.filter(o => o.isActive);
    }

    // Sort by displayOrder ascending
    return offers.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // 2. Backward compatibility fallback: construct offers from legacy purchaseLinks or affiliateLinks
  const legacyLinks: { name: string; url: string }[] = [];

  if (Array.isArray(product.purchaseLinks) && product.purchaseLinks.length > 0) {
    product.purchaseLinks.forEach(l => {
      if (l.name || l.url) {
        legacyLinks.push({ name: l.name || 'Store', url: l.url || '' });
      }
    });
  } else if (Array.isArray(product.affiliateLinks) && product.affiliateLinks.length > 0) {
    product.affiliateLinks.forEach(l => {
      if (l.platform || l.url) {
        legacyLinks.push({ name: l.platform || 'Store', url: l.url || '' });
      }
    });
  }

  const baseOriginal = Number(product.originalPrice) || Number(product.price) || 0;
  const basePrice = Number(product.price) || 0;
  const baseDiscount = calculateDiscountPercent(baseOriginal, basePrice) || Number(product.discount) || 0;

  if (legacyLinks.length > 0) {
    return legacyLinks.map((link, idx) => ({
      id: `legacy-${idx}`,
      retailerName: link.name,
      productUrl: link.url,
      originalPrice: baseOriginal,
      offerPrice: basePrice,
      discountPercent: baseDiscount,
      isActive: true,
      displayOrder: idx,
    }));
  }

  // 3. Fallback if product has no links at all but has a price
  if (basePrice > 0) {
    return [
      {
        id: 'legacy-default',
        retailerName: 'Verified Store',
        productUrl: '',
        originalPrice: baseOriginal,
        offerPrice: basePrice,
        discountPercent: baseDiscount,
        isActive: true,
        displayOrder: 0,
      },
    ];
  }

  return [];
}

export interface BestPriceInfo {
  bestPrice: number;
  originalPrice: number;
  discountPercent: number;
  amountSaved: number;
  retailerName: string | null;
  productUrl: string | null;
  bestOffer: RetailerOffer | null;
  activeOffersCount: number;
  offers: RetailerOffer[];
}

/**
 * Calculates the dynamic Best Price (lowest active offer price) for a product.
 */
export function getProductBestPrice(product?: Partial<Product> | null): BestPriceInfo {
  const activeOffers = getNormalizedRetailerOffers(product, false);

  if (activeOffers.length === 0) {
    const orig = Number(product?.originalPrice) || Number(product?.price) || 0;
    const cur = Number(product?.price) || 0;
    const disc = calculateDiscountPercent(orig, cur) || Number(product?.discount) || 0;

    return {
      bestPrice: cur,
      originalPrice: orig,
      discountPercent: disc,
      amountSaved: Math.max(0, orig - cur),
      retailerName: null,
      productUrl: null,
      bestOffer: null,
      activeOffersCount: 0,
      offers: [],
    };
  }

  // Find offer with minimum offerPrice
  let bestOffer = activeOffers[0];
  for (let i = 1; i < activeOffers.length; i++) {
    if (activeOffers[i].offerPrice < bestOffer.offerPrice) {
      bestOffer = activeOffers[i];
    }
  }

  const origPrice = bestOffer.originalPrice;
  const curPrice = bestOffer.offerPrice;

  return {
    bestPrice: curPrice,
    originalPrice: origPrice,
    discountPercent: bestOffer.discountPercent || calculateDiscountPercent(origPrice, curPrice),
    amountSaved: Math.max(0, origPrice - curPrice),
    retailerName: bestOffer.retailerName,
    productUrl: bestOffer.productUrl,
    bestOffer,
    activeOffersCount: activeOffers.length,
    offers: activeOffers,
  };
}
