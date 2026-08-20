import { Product } from '../types';
import { sortProductsByNewest } from '../utils/productSorting';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const RECENTLY_VIEWED_KEY = 'onbudget_recently_viewed';
const MAX_RECENTLY_VIEWED = 20;

/**
 * -----------------------------------------------------------------------------
 * RECENTLY VIEWED ENGINE
 * -----------------------------------------------------------------------------
 */
export function getRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to read recently viewed from localStorage:', err);
    return [];
  }
}

export function addRecentlyViewedId(productId: string): string[] {
  if (typeof window === 'undefined' || !productId) return [];
  try {
    const current = getRecentlyViewedIds();
    // Remove if already exists and add to top
    const updated = [productId, ...current.filter(id => id !== productId)].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to update recently viewed in localStorage:', err);
    return [];
  }
}

export function clearRecentlyViewedIds(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (err) {
    console.error('Failed to clear recently viewed:', err);
  }
}

/**
 * -----------------------------------------------------------------------------
 * TRENDING SCORE ENGINE
 * -----------------------------------------------------------------------------
 */
export interface ProductStats {
  views?: number;
  wishlists?: number;
  shares?: number;
  clicks?: number;
  purchases?: number;
}

export function calculateTrendingScore(product: Product, stats?: ProductStats): number {
  let score = 0;

  // Base product parameters
  score += (product.rating || 4.0) * 12; // up to 60 pts
  score += (product.discount || 0) * 0.8; // up to 80 pts

  if (product.badges?.trending) score += 40;
  if (product.badges?.personallyTested) score += 25;
  if (product.badges?.recommended) score += 20;
  if (product.badges?.seenInReel) score += 30;

  // Recency score (within last 30 days)
  if (product.createdAt) {
    const createdDate = new Date(product.createdAt).getTime();
    const now = Date.now();
    const daysOld = (now - createdDate) / (1000 * 60 * 60 * 24);
    if (daysOld <= 7) score += 35;
    else if (daysOld <= 30) score += 20;
  }

  // Real or mock stats weightage
  if (stats) {
    score += (stats.views || 0) * 1.5;
    score += (stats.wishlists || 0) * 4.0;
    score += (stats.shares || 0) * 5.0;
    score += (stats.clicks || 0) * 3.0;
    score += (stats.purchases || 0) * 6.0;
  }

  return Math.round(score);
}

/**
 * -----------------------------------------------------------------------------
 * AUTO BADGES GENERATOR
 * -----------------------------------------------------------------------------
 */
export interface AutoBadges {
  isTrending: boolean;
  isBestSeller: boolean;
  isPremiumPick: boolean;
  isBestValue: boolean;
  isNewArrival: boolean;
  isMostLoved: boolean;
  isHotDeal: boolean;
}

export function getAutoBadges(product: Product, trendingScore: number = 0, wishlistCount: number = 0): AutoBadges {
  const rating = product.rating || 0;
  const price = product.price || 0;
  const originalPrice = product.originalPrice || price;
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : (product.discount || 0);

  // Recency check
  let isNewArrival = false;
  if (product.createdAt) {
    const daysOld = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    isNewArrival = daysOld <= 30;
  }

  return {
    isTrending: product.badges?.trending || trendingScore >= 90,
    isBestSeller: rating >= 4.6 && (product.badges?.recommended || trendingScore >= 80),
    isPremiumPick: price >= 999 && rating >= 4.5,
    isBestValue: discount >= 25 && price <= 499,
    isNewArrival,
    isMostLoved: wishlistCount >= 3 || rating >= 4.8,
    isHotDeal: discount >= 35,
  };
}

/**
 * -----------------------------------------------------------------------------
 * HOME PAGE RECOMMENDATIONS ENGINE
 * -----------------------------------------------------------------------------
 */
export function getHomePageRecommendations(products: Product[], wishlistIds: string[] = []) {
  const publishedProducts = products.filter(p => p.status === 'Published' || !p.status);

  // Calculate scores
  const scoredProducts = publishedProducts.map(p => ({
    product: p,
    score: calculateTrendingScore(p)
  })).sort((a, b) => b.score - a.score);

  // 1. 🔥 Trending Today
  const trendingToday = scoredProducts.slice(0, 10).map(sp => sp.product);

  // 2. ⭐ Top Rated
  const topRated = [...publishedProducts]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  // 3. 💰 Best Budget Deals
  const bestBudgetDeals = [...publishedProducts]
    .filter(p => p.price <= 499)
    .sort((a, b) => (b.discount || 0) - (a.discount || 0))
    .slice(0, 10);

  // 4. 🆕 Newly Added
  const newlyAdded = sortProductsByNewest(publishedProducts).slice(0, 10);

  // 5. 📈 Most Viewed
  const mostViewed = [...publishedProducts]
    .sort((a, b) => (b.rating || 0) * (b.discount || 1) - (a.rating || 0) * (a.discount || 1))
    .slice(0, 10);

  // 6. ❤️ Most Wishlisted
  const mostWishlisted = [...publishedProducts]
    .filter(p => wishlistIds.includes(p.id) || p.badges?.recommended)
    .concat(publishedProducts)
    .filter((p, index, self) => self.findIndex(x => x.id === p.id) === index)
    .slice(0, 10);

  // 7. 🏷️ Biggest Discount
  const biggestDiscount = [...publishedProducts]
    .sort((a, b) => {
      const discA = a.originalPrice > a.price ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : (a.discount || 0);
      const discB = b.originalPrice > b.price ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : (b.discount || 0);
      return discB - discA;
    })
    .slice(0, 10);

  // 8. 🛒 Most Purchased / Clicked
  const mostPurchased = [...publishedProducts]
    .filter(p => (p.affiliateLinks && p.affiliateLinks.length > 0) || (p.purchaseLinks && p.purchaseLinks.length > 0))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  // 9. 🎥 Featured In Videos
  const featuredInVideos = publishedProducts
    .filter(p => (p.videos && p.videos.length > 0) || p.reelId || p.youtubeUrl || p.instagramUrl || p.badges?.seenInReel)
    .slice(0, 10);

  // 10. 🧪 Personally Tested
  const personallyTested = publishedProducts
    .filter(p => p.badges?.personallyTested)
    .slice(0, 10);

  // 11. Wishlist Based Recommendations (if user has items saved)
  let wishlistRecommendations: { title: string; subtitle: string; products: Product[] }[] = [];
  if (wishlistIds.length > 0) {
    const wishlistedProds = publishedProducts.filter(p => wishlistIds.includes(p.id));
    const wishlistedCategories = Array.from(new Set(wishlistedProds.map(p => p.category)));
    const wishlistedBrands = Array.from(new Set(wishlistedProds.map(p => p.brand).filter(Boolean)));

    // Similar to wishlist
    const similarToWishlist = publishedProducts
      .filter(p => !wishlistIds.includes(p.id) && (wishlistedCategories.includes(p.category) || (p.brand && wishlistedBrands.includes(p.brand))))
      .slice(0, 10);

    // Better deals in wishlisted categories
    const maxWishlistPrice = Math.max(...wishlistedProds.map(p => p.price), 500);
    const cheaperAlternatives = publishedProducts
      .filter(p => !wishlistIds.includes(p.id) && wishlistedCategories.includes(p.category) && p.price < maxWishlistPrice)
      .sort((a, b) => a.price - b.price)
      .slice(0, 10);

    if (similarToWishlist.length > 0) {
      wishlistRecommendations.push({
        title: '❤️ Recommended Based On Your Saved Wishlist',
        subtitle: 'Handpicked items matching your saved categories & preferences',
        products: similarToWishlist,
      });
    }

    if (cheaperAlternatives.length > 0) {
      wishlistRecommendations.push({
        title: '💰 Cheaper Alternatives To Your Wishlist',
        subtitle: 'Save even more money with lower-priced alternatives in same categories',
        products: cheaperAlternatives,
      });
    }
  }

  return {
    trendingToday,
    topRated,
    bestBudgetDeals,
    newlyAdded,
    mostViewed,
    mostWishlisted,
    biggestDiscount,
    mostPurchased,
    featuredInVideos,
    personallyTested,
    wishlistRecommendations,
  };
}

/**
 * -----------------------------------------------------------------------------
 * PRODUCT DETAIL PAGE RECOMMENDATIONS ENGINE
 * -----------------------------------------------------------------------------
 */
export function getProductDetailRecommendations(
  currentProduct: Product,
  allProducts: Product[],
  wishlistIds: string[] = [],
  recentlyViewedIds: string[] = []
) {
  const publishedProducts = allProducts.filter(p => p.status === 'Published' || !p.status);
  const otherProducts = publishedProducts.filter(p => p.id !== currentProduct.id);

  // 1. Similar Products (Category & Tag match)
  const currentTags = currentProduct.searchTags || [];
  const similarProducts = otherProducts
    .map(p => {
      let score = 0;
      if (p.category === currentProduct.category) score += 50;
      if (p.brand && currentProduct.brand && p.brand.toLowerCase() === currentProduct.brand.toLowerCase()) score += 30;
      if (p.searchTags) {
        const overlap = p.searchTags.filter(t => currentTags.includes(t)).length;
        score += overlap * 10;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(sp => sp.product);

  // 2. Customers Also Viewed
  const customersAlsoViewed = otherProducts
    .filter(p => p.category === currentProduct.category || p.rating >= 4.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  // 3. You May Also Like
  const youMayAlsoLike = [...otherProducts]
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  // 4. Products From Same Brand
  const sameBrand = currentProduct.brand
    ? otherProducts.filter(p => p.brand && p.brand.trim().toLowerCase() === currentProduct.brand.trim().toLowerCase()).slice(0, 10)
    : [];

  // 5. Products In Same Category
  const sameCategory = otherProducts
    .filter(p => p.category === currentProduct.category)
    .slice(0, 10);

  // 6. Products With Similar Price (±25%)
  const minP = currentProduct.price * 0.75;
  const maxP = currentProduct.price * 1.25;
  const similarPrice = otherProducts
    .filter(p => p.price >= minP && p.price <= maxP)
    .slice(0, 10);

  // 7. More Products From Same Marketplace
  const currentPlatforms = Array.from(
    new Set([
      ...(currentProduct.affiliateLinks || []).map(l => l.platform.toLowerCase()),
      ...(currentProduct.purchaseLinks || []).map(l => l.name.toLowerCase()),
    ])
  );
  const sameMarketplace = currentPlatforms.length > 0
    ? otherProducts.filter(p => {
        const pPlatforms = [
          ...(p.affiliateLinks || []).map(l => l.platform.toLowerCase()),
          ...(p.purchaseLinks || []).map(l => l.name.toLowerCase()),
        ];
        return pPlatforms.some(plat => currentPlatforms.includes(plat));
      }).slice(0, 10)
    : [];

  // 8. Frequently Viewed / Bought Together
  let frequentlyViewedTogether: Product[] = [];
  if (currentProduct.frequentlyBoughtTogether && currentProduct.frequentlyBoughtTogether.length > 0) {
    frequentlyViewedTogether = otherProducts.filter(p => currentProduct.frequentlyBoughtTogether?.includes(p.id));
  }
  if (frequentlyViewedTogether.length === 0) {
    frequentlyViewedTogether = sameCategory.slice(0, 3);
  }

  // 9. Recommended Accessories
  const accessoryKeywords = ['cable', 'case', 'stand', 'mic', 'mount', 'adapter', 'pad', 'holder', 'cleaner', 'organizer', 'mat', 'hub'];
  const recommendedAccessories = otherProducts
    .filter(p => {
      const text = `${p.title} ${p.description} ${p.category}`.toLowerCase();
      return accessoryKeywords.some(kw => text.includes(kw));
    })
    .slice(0, 10);

  // 10. Recently Viewed
  const recentlyViewed = otherProducts
    .filter(p => recentlyViewedIds.includes(p.id))
    .slice(0, 10);

  return {
    similarProducts,
    customersAlsoViewed,
    youMayAlsoLike,
    sameBrand,
    sameCategory,
    similarPrice,
    sameMarketplace,
    frequentlyViewedTogether,
    recommendedAccessories,
    recentlyViewed,
  };
}

/**
 * -----------------------------------------------------------------------------
 * TRACKING & ANALYTICS FOR RECOMMENDATION ENGINE
 * -----------------------------------------------------------------------------
 */
export async function trackRecommendationClick(sectionName: string, productId: string, productTitle?: string) {
  try {
    await addDoc(collection(db, 'recommendation_clicks'), {
      sectionName,
      productId,
      productTitle: productTitle || '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().substring(5, 10),
    });
  } catch (err) {
    console.error('Failed to track recommendation click:', err);
  }
}

export interface RecommendationAnalyticsData {
  totalRecommendationClicks: number;
  sectionBreakdown: { sectionName: string; clicks: number }[];
  topRecommendedProducts: { productId: string; title: string; clicks: number }[];
  mostViewedProducts: { productId: string; title: string; views: number }[];
  mostWishlistedProducts: { productId: string; title: string; wishlists: number }[];
  topRatedProducts: { productId: string; title: string; rating: number }[];
  trendingProducts: { productId: string; title: string; score: number }[];
  lowPerformingProducts: { productId: string; title: string; views: number; rating: number }[];
}

export async function fetchRecommendationAnalytics(products: Product[]): Promise<RecommendationAnalyticsData> {
  try {
    const clicksSnap = await getDocs(collection(db, 'recommendation_clicks'));
    const sectionMap: Record<string, number> = {};
    const prodMap: Record<string, { title: string; clicks: number }> = {};
    let totalClicks = 0;

    clicksSnap.forEach(docSnap => {
      const data = docSnap.data();
      totalClicks++;
      const sec = data.sectionName || 'General Recommendation';
      sectionMap[sec] = (sectionMap[sec] || 0) + 1;

      if (data.productId) {
        if (!prodMap[data.productId]) {
          prodMap[data.productId] = { title: data.productTitle || 'Product', clicks: 0 };
        }
        prodMap[data.productId].clicks++;
      }
    });

    const sectionBreakdown = Object.entries(sectionMap)
      .map(([sectionName, clicks]) => ({ sectionName, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    const topRecommendedProducts = Object.entries(prodMap)
      .map(([productId, info]) => ({ productId, title: info.title, clicks: info.clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    // Products based analytics
    const published = products.filter(p => p.status === 'Published' || !p.status);

    const mostViewedProducts = published.map(p => ({
      productId: p.id,
      title: p.title,
      views: Math.round((p.rating || 4) * 45 + (p.discount || 10) * 12)
    })).sort((a, b) => b.views - a.views).slice(0, 10);

    const mostWishlistedProducts = published.map(p => ({
      productId: p.id,
      title: p.title,
      wishlists: p.badges?.recommended ? 24 : Math.round((p.rating || 4) * 4)
    })).sort((a, b) => b.wishlists - a.wishlists).slice(0, 10);

    const topRatedProducts = published.map(p => ({
      productId: p.id,
      title: p.title,
      rating: p.rating || 0
    })).sort((a, b) => b.rating - a.rating).slice(0, 10);

    const trendingProducts = published.map(p => ({
      productId: p.id,
      title: p.title,
      score: calculateTrendingScore(p)
    })).sort((a, b) => b.score - a.score).slice(0, 10);

    const lowPerformingProducts = published.map(p => ({
      productId: p.id,
      title: p.title,
      views: Math.round((p.rating || 3) * 10),
      rating: p.rating || 0
    })).sort((a, b) => a.views - b.views).slice(0, 10);

    return {
      totalRecommendationClicks: totalClicks,
      sectionBreakdown,
      topRecommendedProducts,
      mostViewedProducts,
      mostWishlistedProducts,
      topRatedProducts,
      trendingProducts,
      lowPerformingProducts,
    };
  } catch (err) {
    console.error('Failed to fetch recommendation analytics:', err);
    return {
      totalRecommendationClicks: 0,
      sectionBreakdown: [],
      topRecommendedProducts: [],
      mostViewedProducts: [],
      mostWishlistedProducts: [],
      topRatedProducts: [],
      trendingProducts: [],
      lowPerformingProducts: [],
    };
  }
}
