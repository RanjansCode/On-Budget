import { Product, HomepageSectionConfig, SectionFilterRules } from '../types';
import { calculateTrendingScore } from '../lib/recommendationEngine';

/**
 * Checks whether a single product passes a single condition.
 */
function testCondition(product: Product, conditionKey: string, value: any): boolean {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return true; // Not actively filtering on this condition
  }

  switch (conditionKey) {
    case 'category':
    case 'categoryIds': {
      const allowedCategories = Array.isArray(value) ? value : [value];
      if (allowedCategories.length === 0 || allowedCategories.includes('all')) return true;
      const productCatName = String(product.category || '').toLowerCase();
      return allowedCategories.some(c => {
        const target = String(c).toLowerCase();
        return productCatName === target || productCatName.includes(target);
      });
    }

    case 'brand':
    case 'brands': {
      const allowedBrands = Array.isArray(value) ? value : [value];
      if (allowedBrands.length === 0 || allowedBrands.includes('all')) return true;
      const productBrand = String(product.brand || '').toLowerCase().trim();
      return allowedBrands.some(b => {
        const target = String(b).toLowerCase().trim();
        return productBrand === target || productBrand.includes(target);
      });
    }

    case 'platform':
    case 'platforms': {
      const allowedPlatforms = Array.isArray(value) ? value : [value];
      if (allowedPlatforms.length === 0 || allowedPlatforms.includes('all')) return true;
      const pLinks = product.purchaseLinks || [];
      const affLinks = product.affiliateLinks || [];
      const retailerOffers = product.retailerOffers || [];
      return allowedPlatforms.some(platform => {
        const pLower = String(platform).toLowerCase();
        const hasPLink = pLinks.some(l => (l.name || '').toLowerCase().includes(pLower) || (l.url || '').toLowerCase().includes(pLower));
        const hasAff = affLinks.some(a => (a.platform || '').toLowerCase().includes(pLower) || (a.url || '').toLowerCase().includes(pLower));
        const hasOffer = retailerOffers.some(o => (o.retailerName || '').toLowerCase().includes(pLower) || (o.productUrl || '').toLowerCase().includes(pLower));
        return hasPLink || hasAff || hasOffer;
      });
    }

    case 'maxPrice': {
      const num = Number(value);
      if (isNaN(num) || num <= 0) return true;
      return (product.price || 0) <= num;
    }

    case 'minPrice': {
      const num = Number(value);
      if (isNaN(num) || num <= 0) return true;
      return (product.price || 0) >= num;
    }

    case 'minDiscount': {
      const num = Number(value);
      if (isNaN(num) || num <= 0) return true;
      return (product.discount || 0) >= num;
    }

    case 'minRating': {
      const num = Number(value);
      if (isNaN(num) || num <= 0) return true;
      return (product.rating || 0) >= num;
    }

    case 'personallyTested': {
      if (value !== true) return true;
      return product.badges?.personallyTested === true;
    }

    case 'featuredInVideo': {
      if (value !== true) return true;
      return (
        product.badges?.seenInReel === true ||
        Boolean(product.reelId) ||
        Boolean(product.instagramUrl) ||
        Boolean(product.youtubeUrl) ||
        (Array.isArray(product.videos) && product.videos.length > 0)
      );
    }

    case 'trending': {
      if (value !== true) return true;
      return product.badges?.trending === true || calculateTrendingScore(product) >= 40;
    }

    case 'newlyAdded': {
      if (value !== true) return true;
      if (!product.createdAt) return false;
      const ageInDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return ageInDays <= 30;
    }

    case 'hasInstagramReel': {
      if (value !== true) return true;
      return Boolean(product.instagramUrl) || product.badges?.seenInReel === true;
    }

    case 'hasYouTubeVideo': {
      if (value !== true) return true;
      return Boolean(product.youtubeUrl);
    }

    case 'hasCoupon': {
      if (value !== true) return true;
      return Boolean(product.couponCode);
    }

    case 'hasVariants': {
      if (value !== true) return true;
      return Boolean(product.hasVariants) || (Array.isArray(product.variants) && product.variants.length > 0);
    }

    case 'tags': {
      const allowedTags = Array.isArray(value) ? value : [value];
      if (allowedTags.length === 0) return true;
      const pTags = (product.searchTags || []).map(t => String(t).toLowerCase());
      return allowedTags.some(tag => pTags.includes(String(tag).toLowerCase()));
    }

    default:
      return true;
  }
}

/**
 * Filter products based on SectionFilterRules and conditionLogic ('AND' vs 'OR').
 */
export function filterProductsByRules(products: Product[], rules?: SectionFilterRules): Product[] {
  if (!rules) return products;

  const isOr = rules.conditionLogic === 'OR';

  // Identify active conditions
  const activeConditions: { key: string; val: any }[] = [];

  if (rules.categoryIds && rules.categoryIds.length > 0 && !rules.categoryIds.includes('all')) {
    activeConditions.push({ key: 'categoryIds', val: rules.categoryIds });
  } else if (rules.categoryNames && rules.categoryNames.length > 0 && !rules.categoryNames.includes('all')) {
    activeConditions.push({ key: 'category', val: rules.categoryNames });
  }

  if (rules.brands && rules.brands.length > 0 && !rules.brands.includes('all')) {
    activeConditions.push({ key: 'brands', val: rules.brands });
  }

  if (rules.platforms && rules.platforms.length > 0 && !rules.platforms.includes('all')) {
    activeConditions.push({ key: 'platforms', val: rules.platforms });
  }

  if (rules.maxPrice && rules.maxPrice > 0) {
    activeConditions.push({ key: 'maxPrice', val: rules.maxPrice });
  }

  if (rules.minPrice && rules.minPrice > 0) {
    activeConditions.push({ key: 'minPrice', val: rules.minPrice });
  }

  if (rules.minDiscount && rules.minDiscount > 0) {
    activeConditions.push({ key: 'minDiscount', val: rules.minDiscount });
  }

  if (rules.minRating && rules.minRating > 0) {
    activeConditions.push({ key: 'minRating', val: rules.minRating });
  }

  if (rules.personallyTested === true) {
    activeConditions.push({ key: 'personallyTested', val: true });
  }

  if (rules.featuredInVideo === true) {
    activeConditions.push({ key: 'featuredInVideo', val: true });
  }

  if (rules.trending === true) {
    activeConditions.push({ key: 'trending', val: true });
  }

  if (rules.newlyAdded === true) {
    activeConditions.push({ key: 'newlyAdded', val: true });
  }

  if (rules.hasInstagramReel === true) {
    activeConditions.push({ key: 'hasInstagramReel', val: true });
  }

  if (rules.hasYouTubeVideo === true) {
    activeConditions.push({ key: 'hasYouTubeVideo', val: true });
  }

  if (rules.hasCoupon === true) {
    activeConditions.push({ key: 'hasCoupon', val: true });
  }

  if (rules.hasVariants === true) {
    activeConditions.push({ key: 'hasVariants', val: true });
  }

  if (rules.tags && rules.tags.length > 0) {
    activeConditions.push({ key: 'tags', val: rules.tags });
  }

  // If no conditions were set, return all
  if (activeConditions.length === 0) {
    return products;
  }

  return products.filter(product => {
    // Only published products by default
    if (product.status && product.status !== 'Published') return false;

    if (isOr) {
      // ANY condition passes
      return activeConditions.some(cond => testCondition(product, cond.key, cond.val));
    } else {
      // ALL conditions must pass
      return activeConditions.every(cond => testCondition(product, cond.key, cond.val));
    }
  });
}

/**
 * Sorts products based on section sorting rules.
 */
export function sortProductsBySectionSorting(products: Product[], sorting: string): Product[] {
  const cloned = [...products];

  switch (sorting) {
    case 'trending':
      return cloned.sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a));

    case 'newest':
      return cloned.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

    case 'oldest':
      return cloned.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

    case 'price_asc':
      return cloned.sort((a, b) => (a.price || 0) - (b.price || 0));

    case 'price_desc':
      return cloned.sort((a, b) => (b.price || 0) - (a.price || 0));

    case 'discount_desc':
      return cloned.sort((a, b) => (b.discount || 0) - (a.discount || 0));

    case 'rating_desc':
      return cloned.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    case 'most_viewed':
      return cloned.sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a));

    case 'most_wishlisted':
      return cloned.sort((a, b) => {
        const scoreA = (a.badges?.recommended ? 20 : 0) + (a.rating || 0) * 10;
        const scoreB = (b.badges?.recommended ? 20 : 0) + (b.rating || 0) * 10;
        return scoreB - scoreA;
      });

    case 'most_purchased':
      return cloned.sort((a, b) => (b.rating * b.discount) - (a.rating * a.discount));

    case 'recently_updated':
      return cloned.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

    case 'random':
      return cloned.sort(() => Math.random() - 0.5);

    default:
      return cloned;
  }
}

/**
 * Main engine to retrieve, filter, sort, and slice products for a given homepage section configuration.
 */
export function getProductsForSection(
  products: Product[],
  section: HomepageSectionConfig,
  wishlist?: string[],
  recentlyViewedIds?: string[]
): Product[] {
  if (!products || products.length === 0) return [];

  // Filter out any non-published products
  const publishedProducts = products.filter(p => !p.status || p.status === 'Published');

  // Case 1: Manual product selection
  if (section.productSource === 'manual') {
    const manualIds = section.manualProductIds || [];
    if (manualIds.length === 0) return [];

    // Lookup products in exact order
    const productMap = new Map<string, Product>();
    publishedProducts.forEach(p => productMap.set(p.id, p));

    const selected: Product[] = [];
    for (const id of manualIds) {
      const p = productMap.get(id);
      if (p) selected.push(p);
    }

    const limit = section.maxProducts || 10;
    return selected.slice(0, limit);
  }

  // Case 2: Automatic rule-based selection
  const filtered = filterProductsByRules(publishedProducts, section.filters);
  const sorted = sortProductsBySectionSorting(filtered, section.sorting || 'trending');
  const limit = section.maxProducts || 10;

  return sorted.slice(0, limit);
}
