/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AffiliateLink {
  platform: 'Amazon' | 'Meesho' | 'Flipkart' | 'Ajio' | 'Myntra' | 'Nykaa' | 'Croma' | 'Tata CliQ';
  url: string;
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
  videos: string[]; // Product video clip
  affiliateLinks: AffiliateLink[];
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
  'ranjan.edits.designs@gmail.com'
];

export const ADMIN_PHONES = [
  '+917654800013' // Default admin phone number. Can be expanded as needed.
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

