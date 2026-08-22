/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AffiliateLink {
  platform: string;
  url: string;
}

export interface PurchaseLink {
  name: string;
  url: string;
}

export interface Retailer {
  id: string; // Slug/ID like "amazon", "meesho", "flipkart"
  name: string; // Display Name like "Amazon", "Meesho"
  logoUrl: string; // Asset path or storage/base64 URL
  status: 'active' | 'disabled';
  createdAt?: string;
  updatedAt?: string;
}

export interface RetailerOffer {
  id: string;
  retailerId?: string;
  retailerName: string;
  retailerLogoUrl?: string;
  productUrl: string;
  originalPrice: number;
  offerPrice: number;
  discountPercent?: number | null;
  isActive: boolean;
  displayOrder: number;
}

export interface CreatorReview {
  rating: number; // 1-5 stars
  reviewText: string;
  unboxingText: string;
  setupGuideText: string;
  myExperience: string;
  myVerdict: string;
  photos: string[]; // local reference or public CDNs
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProductSpec {
  name: string;
  value: string;
}

export type VariantStockStatus = 'in_stock' | 'limited_stock' | 'out_of_stock' | 'unavailable';

export interface ProductVariantOption {
  id: string; // e.g. "opt_color" or "opt_size"
  name: string; // e.g. "Color", "Size", "Storage", "Material", "Pack Size"
  values: string[]; // e.g. ["Black", "White", "Blue"] or ["Small", "Large"]
}

export interface ProductVariant {
  id: string; // Unique variant ID, e.g. "var-1"
  title?: string; // Optional variant-specific product title (e.g. "Premium Wireless Mouse – Black – Large")
  sku?: string; // Optional SKU, e.g. "KOATY-BLK-LRG"
  options: Record<string, string>; // e.g. { "Color": "Black", "Size": "Large" }
  price?: number; // Variant specific offer price
  originalPrice?: number; // Variant specific MRP
  discount?: number; // Calculated or manual discount %
  affiliateUrl?: string; // Specific affiliate / Buy URL
  images?: string[]; // Variant specific image gallery
  stockStatus?: VariantStockStatus; // In stock, limited, out of stock, unavailable
  isActive: boolean; // Whether this variant is enabled
}

export interface Product {
  id: string;
  title: string;
  price: number; // Current Price in INR
  originalPrice: number; // MRP in INR
  discount: number; // Discount %
  description: string;
  whyIRecommend: string;
  brand: string;
  category: string;
  rating: number; // 1-5
  images: string[];
  image?: string; // Legacy fallback field
  videos: string[]; // Product video clip
  affiliateLinks: AffiliateLink[];
  purchaseLinks?: PurchaseLink[];
  retailerOffers?: RetailerOffer[];
  hasVariants?: boolean; // Whether variants are enabled
  variantOptions?: ProductVariantOption[]; // List of option dimensions
  variants?: ProductVariant[]; // List of concrete variant combinations
  badges: {
    seenInReel: boolean;
    personallyTested: boolean;
    recommended: boolean;
    trending: boolean;
  };
  creatorReview: CreatorReview;
  pros: string[];
  cons: string[];
  specifications: ProductSpec[];
  features: string[];
  couponCode?: string;
  alternatives: string[]; // Titles or IDs of better alternatives
  frequentlyBoughtTogether: string[]; // Product IDs
  faqs: FAQItem[];
  reelId?: string; // ID of the Reel featuring this product
  youtubeUrl?: string; // Optional YouTube video link
  instagramUrl?: string; // Optional Instagram reel/post link
  searchTags?: string[]; // Custom search keywords/tags
  seoTitle?: string; // Dedicated SEO Title
  seoDescription?: string; // Dedicated SEO Description
  seoSlug?: string; // Dedicated SEO URL Slug (e.g. maono-au-400-lavalier-microphone)
  status: 'Published' | 'Draft';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
}

export interface Reel {
  id: string;
  title: string;
  platform: 'Instagram' | 'YouTube';
  videoUrl: string; // Embed or simulation video URL
  thumbnailUrl: string;
  category: string;
  productId: string;
  likes: number;
  shares: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
}

export interface AnalyticsData {
  totalVisitors: number;
  pageViews: number;
  averageTime: number; // in seconds
  bounceRate: number; // %
  devices: { device: string; count: number }[];
  countries: { country: string; count: number }[];
  affiliateClicks: { platform: string; clicks: number }[];
  topCategories: { category: string; clicks: number }[];
  topProducts: { productId: string; title: string; clicks: number }[];
  clicksHistory: { date: string; clicks: number }[];
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'deal' | 'price_drop' | 'review' | 'trending';
  date: string;
  read: boolean;
}

export const ADMIN_EMAILS = [
  'ranjan.edits.designs@gmail.com',
  'amitadevi7654@gmail.com'
];

export interface UserProfile {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
}

export interface PromotionalBanner {
  id: string;
  name: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  destinationUrl: string;
  displayOrder: number;
  isActive: boolean;
  startAt?: string;
  endAt?: string;
  bannerWidth?: number;
  bannerHeight?: number;
  aspectRatioPreset?: '585x282' | '1771x835' | '16x9' | 'custom';
  objectFit?: 'contain' | 'cover';
  createdAt: string;
  updatedAt: string;
}

export type SectionStatus = 'published' | 'hidden' | 'draft' | 'archived';

export type SectionType =
  | 'carousel'
  | 'grid_2'
  | 'grid_3'
  | 'grid_4'
  | 'featured_large'
  | 'compact'
  | 'category_showcase'
  | 'brand_showcase'
  | 'video_products'
  | 'banner_promo'
  | 'custom_collection'
  | 'price_collection'
  | 'tag_collection';

export type SectionProductSource = 'auto' | 'manual';

export type SectionSorting =
  | 'trending'
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'discount_desc'
  | 'rating_desc'
  | 'most_viewed'
  | 'most_wishlisted'
  | 'most_purchased'
  | 'recently_updated'
  | 'manual'
  | 'random';

export type SectionDisplayStyle =
  | 'carousel'
  | 'grid_2'
  | 'grid_3'
  | 'grid_4'
  | 'featured_large'
  | 'compact';

export interface SectionFilterRules {
  conditionLogic?: 'AND' | 'OR';
  categoryIds?: string[];
  categoryNames?: string[];
  brands?: string[];
  platforms?: string[];
  maxPrice?: number;
  minPrice?: number;
  minDiscount?: number;
  minRating?: number;
  personallyTested?: boolean;
  featuredInVideo?: boolean;
  trending?: boolean;
  newlyAdded?: boolean;
  hasInstagramReel?: boolean;
  hasYouTubeVideo?: boolean;
  hasCoupon?: boolean;
  hasVariants?: boolean;
  tags?: string[];
  badge?: string;
}

export interface HomepageSectionConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  type: SectionType;
  productSource: SectionProductSource;
  displayStyle: SectionDisplayStyle;
  maxProducts: number;
  status: SectionStatus;
  visible: boolean;
  order: number;
  isBuiltIn: boolean;
  builtInKey?: string;
  filters?: SectionFilterRules;
  sorting: SectionSorting;
  manualProductIds?: string[];
  badge?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface HomepageSectionVisibility {
  trendingToday: boolean;
  topRated: boolean;
  bestBudgetDeals: boolean;
  newlyAdded: boolean;
  mostViewed: boolean;
  mostWishlisted: boolean;
  biggestDiscount: boolean;
  mostPurchased: boolean;
  featuredInVideos: boolean;
  personallyTested: boolean;
}

export interface HomepageSectionsSettings {
  id: string;
  sections: HomepageSectionVisibility;
  customSections?: HomepageSectionConfig[];
  updatedAt: string;
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionVisibility = {
  trendingToday: true,
  topRated: true,
  bestBudgetDeals: true,
  newlyAdded: true,
  mostViewed: true,
  mostWishlisted: true,
  biggestDiscount: true,
  mostPurchased: true,
  featuredInVideos: true,
  personallyTested: true,
};

export const DEFAULT_HOMEPAGE_SECTIONS_CONFIG: HomepageSectionConfig[] = [
  {
    id: 'trendingToday',
    builtInKey: 'trendingToday',
    title: 'Trending Today',
    description: 'Gadgets receiving highest real-time views, wishlist saves & shares',
    icon: '🔥',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 1,
    isBuiltIn: true,
    sorting: 'trending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'topRated',
    builtInKey: 'topRated',
    title: 'Top Rated',
    description: 'Highly rated gadgets with top reviewer verifications',
    icon: '⭐',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 2,
    isBuiltIn: true,
    sorting: 'rating_desc',
    filters: { minRating: 4.0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bestBudgetDeals',
    builtInKey: 'bestBudgetDeals',
    title: 'Best Budget Deals',
    description: 'Super affordable picks under ₹499 with heavy savings',
    icon: '💰',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 3,
    isBuiltIn: true,
    sorting: 'discount_desc',
    filters: { maxPrice: 499 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'newlyAdded',
    builtInKey: 'newlyAdded',
    title: 'Newly Added',
    description: 'Freshly uploaded budget recommendations',
    icon: '🆕',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 4,
    isBuiltIn: true,
    sorting: 'newest',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mostViewed',
    builtInKey: 'mostViewed',
    title: 'Most Viewed',
    description: 'The most clicked product detail pages across the store',
    icon: '📈',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 5,
    isBuiltIn: true,
    sorting: 'most_viewed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mostWishlisted',
    builtInKey: 'mostWishlisted',
    title: 'Most Wishlisted',
    description: 'Products shoppers save most to buy later',
    icon: '❤️',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 6,
    isBuiltIn: true,
    sorting: 'most_wishlisted',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'biggestDiscount',
    builtInKey: 'biggestDiscount',
    title: 'Biggest Discount',
    description: 'Highest percentage discount drops available today',
    icon: '🏷️',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 7,
    isBuiltIn: true,
    sorting: 'discount_desc',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mostPurchased',
    builtInKey: 'mostPurchased',
    title: 'Most Purchased',
    description: 'Top converted products on Amazon, Meesho, Flipkart',
    icon: '🛒',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 8,
    isBuiltIn: true,
    sorting: 'most_purchased',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'featuredInVideos',
    builtInKey: 'featuredInVideos',
    title: 'Featured In Videos',
    description: 'Products with Instagram Reels and YouTube unboxing breakdowns',
    icon: '🎥',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 9,
    isBuiltIn: true,
    sorting: 'trending',
    filters: { featuredInVideo: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'personallyTested',
    builtInKey: 'personallyTested',
    title: 'Personally Tested',
    description: '100% physically unboxed, tested, and approved by the creator',
    icon: '🧪',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    order: 10,
    isBuiltIn: true,
    sorting: 'rating_desc',
    filters: { personallyTested: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export interface HomepageSectionMeta {
  id: keyof HomepageSectionVisibility;
  name: string;
  badge: string;
  iconName: string;
  description: string;
}

export const HOMEPAGE_SECTIONS_META: HomepageSectionMeta[] = [
  {
    id: 'trendingToday',
    name: 'Trending Today',
    badge: '🔥',
    iconName: 'Flame',
    description: 'Highest real-time views, wishlist saves & shares',
  },
  {
    id: 'topRated',
    name: 'Top Rated',
    badge: '⭐',
    iconName: 'Star',
    description: 'Highly rated products with top reviewer verification',
  },
  {
    id: 'bestBudgetDeals',
    name: 'Best Budget Deals',
    badge: '💰',
    iconName: 'DollarSign',
    description: 'Affordable products with strong savings',
  },
  {
    id: 'newlyAdded',
    name: 'Newly Added',
    badge: '🆕',
    iconName: 'Sparkles',
    description: 'Recently uploaded products',
  },
  {
    id: 'mostViewed',
    name: 'Most Viewed',
    badge: '📈',
    iconName: 'TrendingUp',
    description: 'Products receiving the most detail-page views',
  },
  {
    id: 'mostWishlisted',
    name: 'Most Wishlisted',
    badge: '❤️',
    iconName: 'Heart',
    description: 'Products shoppers save most often',
  },
  {
    id: 'biggestDiscount',
    name: 'Biggest Discount',
    badge: '🏷️',
    iconName: 'Tag',
    description: 'Products with the highest percentage discounts',
  },
  {
    id: 'mostPurchased',
    name: 'Most Purchased',
    badge: '🛒',
    iconName: 'ShoppingBag',
    description: 'Products with the highest purchase/conversion activity',
  },
  {
    id: 'featuredInVideos',
    name: 'Featured In Videos',
    badge: '🎥',
    iconName: 'Video',
    description: 'Products connected to Instagram Reels or YouTube videos',
  },
  {
    id: 'personallyTested',
    name: 'Personally Tested',
    badge: '🧪',
    iconName: 'FlaskConical',
    description: 'Products personally tested and approved by the creator',
  },
];

