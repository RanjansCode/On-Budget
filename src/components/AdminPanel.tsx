/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ShieldAlert, LayoutDashboard, ShoppingBag, FolderOpen, Film, Plus, Edit2, Trash2,
  TrendingUp, MousePointer, Share2, DollarSign, Upload, Info, Check, Eye, HelpCircle, Save, X,
  SlidersHorizontal, Search, Sparkles, Image, ArrowUp, ArrowDown, Calendar, Power, Megaphone,
  RefreshCw, AlertCircle, Store
} from 'lucide-react';
import { Product, Category, Reel, AnalyticsData, PurchaseLink, PromotionalBanner, RetailerOffer, Retailer } from '../types';
import { validateSocialUrl, validatePurchaseUrl, formatUrl } from '../utils/validation';
import { getPurchaseLinks } from '../utils/purchaseLinks';
import { getNormalizedRetailerOffers, calculateDiscountPercent } from '../utils/retailerOffers';
import PlatformLogo from './PlatformLogo';
import RetailerLogo from './RetailerLogo';
import { calculateDiscount } from '../utils/discount';
import AdminLaunchMode from './AdminLaunchMode';
import { LaunchSettings } from '../firebase/firestore';
import { AdminFormSkeleton } from './Skeletons';
import { slugify, generateUniqueSlug, getDomain, calculateProductSEOScore } from '../lib/seo';
import { fetchSearchAnalyticsData } from '../lib/searchEngine';
import CategoryIcon, { CATEGORY_ICON_OPTIONS } from './CategoryIcon';
import { getBannerStatus, isBannerActive, PromotionalCarousel } from './PromotionalCarousel';
import { uploadFileToStorage } from '../lib/firebase';
import { getProductImages, getProductMainImage } from '../utils/imageUtils';
import { INITIAL_RETAILERS } from '../data';
import { normalizeRetailerKey, getMasterRetailer } from '../utils/retailerLogos';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  reels: Reel[];
  promotionalBanners: PromotionalBanner[];
  retailers?: Retailer[];
  analytics: AnalyticsData;
  isLoading?: boolean;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddReel: (reel: Reel) => void;
  onUpdateReel: (reel: Reel) => void;
  onDeleteReel: (reelId: string) => void;
  onAddPromotionalBanner: (banner: PromotionalBanner) => void;
  onUpdatePromotionalBanner: (banner: PromotionalBanner) => void;
  onDeletePromotionalBanner: (bannerId: string) => void;
  onReorderPromotionalBanners: (banners: PromotionalBanner[]) => void;
  onAddRetailer?: (retailer: Retailer) => void;
  onUpdateRetailer?: (retailer: Retailer) => void;
  onDeleteRetailer?: (retailerId: string) => void;
  launchSettings: LaunchSettings;
  onSaveLaunchSettings: (settings: LaunchSettings) => Promise<void>;
}

export default function AdminPanel({
  products,
  categories,
  reels,
  promotionalBanners = [],
  retailers = [],
  analytics,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddReel,
  onUpdateReel,
  onDeleteReel,
  onAddPromotionalBanner,
  onUpdatePromotionalBanner,
  onDeletePromotionalBanner,
  onReorderPromotionalBanners,
  onAddRetailer,
  onUpdateRetailer,
  onDeleteRetailer,
  launchSettings,
  onSaveLaunchSettings,
  isLoading = false,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'banners' | 'launch' | 'search' | 'retailers'>('dashboard');
  const [searchAnalyticsData, setSearchAnalyticsData] = useState<any>(null);
  const [loadingSearchAnalytics, setLoadingSearchAnalytics] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'search') {
      setLoadingSearchAnalytics(true);
      fetchSearchAnalyticsData()
        .then(data => setSearchAnalyticsData(data))
        .finally(() => setLoadingSearchAnalytics(false));
    }
  }, [activeTab]);

  // Modal / Form States
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [previewingBanner, setPreviewingBanner] = useState<PromotionalBanner | null>(null);
  const [deleteConfirmBannerId, setDeleteConfirmBannerId] = useState<string | null>(null);

  const [retailerFormOpen, setRetailerFormOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null);
  const [deleteConfirmRetailerId, setDeleteConfirmRetailerId] = useState<string | null>(null);

  // Image Presets for premium catalog creation
  const imagePresets = [
    'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80'
  ];

  // Helper charts and metrics data
  const chartData = analytics.clicksHistory;

  const platformChartData = analytics.affiliateClicks.map(p => ({
    name: p.platform,
    clicks: p.clicks
  }));

  const topPlatformItem = analytics.affiliateClicks.length > 0
    ? [...analytics.affiliateClicks].sort((a, b) => b.clicks - a.clicks)[0]
    : null;
  const topPlatformName = topPlatformItem && topPlatformItem.clicks > 0 ? topPlatformItem.platform : 'None';
  const totalAffiliateClicks = analytics.affiliateClicks.reduce((sum, curr) => sum + curr.clicks, 0);
  const topPlatformPercentage = topPlatformItem && totalAffiliateClicks > 0
    ? Math.round((topPlatformItem.clicks / totalAffiliateClicks) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
          <div className="space-y-2">
            <div className="w-36 h-5 rounded skeleton-shimmer" />
            <div className="w-64 h-3 rounded skeleton-shimmer" />
          </div>
        </div>
        <AdminFormSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Navbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-white">In Our Budget HQ</h2>
            <span className="text-[9px] font-bold tracking-wide bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
              Admin Session
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Manage curated links, product catalog, and promotional banners.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium bg-neutral-800/80 border border-neutral-700/50 px-3 py-1.5 rounded-xl">
            Verified Admin Session
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard Metrics
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Product Manager ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Category Manager ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'banners'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Image className="w-4 h-4" />
          Promotional Banners ({promotionalBanners.length})
        </button>
        <button
          onClick={() => setActiveTab('launch')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'launch'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Launch Mode Settings
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'search'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Search Analytics
        </button>
        <button
          onClick={() => setActiveTab('retailers')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'retailers'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          Retailers ({retailers.length})
        </button>
      </div>

      {/* Content Render */}
      <div>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 border rounded-2xl flex flex-col justify-between" style={{ backgroundColor: '#e9e9e9' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#ff4300' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: '#ff4300' }} /> Total Visitors
                </span>
                <span className="text-2xl font-black mt-2" style={{ color: '#000000' }}>{analytics.totalVisitors.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">Real-time unique visitors</span>
              </div>

              <div className="p-5 border rounded-2xl flex flex-col justify-between" style={{ backgroundColor: '#e9e9e9' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#ff4300' }}>
                  <MousePointer className="w-3.5 h-3.5" style={{ color: '#ff4300' }} /> Total Link Clicks
                </span>
                <span className="text-2xl font-black mt-2" style={{ color: '#000000' }}>{analytics.pageViews.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                  CTR: {analytics.totalVisitors > 0 ? ((analytics.pageViews / analytics.totalVisitors) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>

              <div className="p-5 border rounded-2xl flex flex-col justify-between" style={{ backgroundColor: '#e9e9e9' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#ff4300' }}>
                  <DollarSign className="w-3.5 h-3.5" style={{ color: '#ff4300' }} /> Affiliate Clicks
                </span>
                <span className="text-2xl font-black mt-2" style={{ color: '#000000' }}>
                  {totalAffiliateClicks.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">Conversion: {analytics.bounceRate}%</span>
              </div>

              <div className="p-5 border rounded-2xl flex flex-col justify-between" style={{ backgroundColor: '#e9e9e9' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#ff4300' }}>
                  <Share2 className="w-3.5 h-3.5" style={{ color: '#ff4300' }} /> Top Platform
                </span>
                <span className="text-2xl font-black mt-2" style={{ color: '#000000' }}>{topPlatformName}</span>
                <span className="text-[10px] font-medium mt-1" style={{ color: '#00d492' }}>{topPlatformPercentage}% of traffic destination</span>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div className="p-5 border rounded-2xl space-y-4" style={{ backgroundColor: '#e9e9e9' }}>
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Traffic & Clicks Timeline</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#000000" style={{ fontSize: '10px' }} tick={{ fill: '#000000' }} />
                      <YAxis stroke="#000000" style={{ fontSize: '10px' }} tick={{ fill: '#000000' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff' }} />
                      <Area type="monotone" dataKey="clicks" stroke="#10b981" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="p-5 border rounded-2xl space-y-4" style={{ backgroundColor: '#e9e9e9' }}>
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider"> clicks by affiliate platform</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformChartData}>
                      <XAxis dataKey="name" stroke="#000000" style={{ fontSize: '10px' }} tick={{ fill: '#000000' }} />
                      <YAxis stroke="#000000" style={{ fontSize: '10px' }} tick={{ fill: '#000000' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff' }} />
                      <Bar dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="p-5 border rounded-2xl" style={{ backgroundColor: '#e9e9e9' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#ff4300' }}>Top Performing Products</h3>
                <div className="space-y-3">
                  {analytics.topProducts.map((p, idx) => (
                    <div key={p.productId} className="flex items-center justify-between p-2 bg-neutral-950 border border-neutral-850 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-neutral-500 w-5">#{idx + 1}</span>
                        <div className="min-w-0">
                           <p className="text-xs font-bold text-white truncate">{p.title}</p>
                           <p className="text-[10px] text-neutral-500 font-mono">ID: {p.productId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-emerald-400">{p.clicks} clicks</p>
                        <p className="text-[9px] text-neutral-500 font-medium">
                          Share: {analytics.pageViews > 0 ? Math.round((p.clicks / analytics.pageViews) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic details */}
              <div className="p-5 border rounded-2xl" style={{ backgroundColor: '#e9e9e9' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#ff4300' }}>Traffic Demographics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#008057' }}>Devices</h4>
                    <div className="space-y-2">
                      {analytics.devices.map(d => (
                        <div key={d.device} className="flex justify-between items-center text-xs" style={{ color: '#000000' }}>
                          <span>{d.device}</span>
                          <span className="font-bold">{d.count} ({Math.round(d.count / (analytics.devices.reduce((acc, curr) => acc + curr.count, 0) || 1) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#008057' }}>Countries</h4>
                    <div className="space-y-2">
                      {analytics.countries.map(c => (
                        <div key={c.country} className="flex justify-between items-center text-xs" style={{ color: '#000000' }}>
                          <span>{c.country}</span>
                          <span className="font-bold">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Manager Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Curated Products Catalog</h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductFormOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {/* List */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase bg-neutral-950/40">
                      <th className="p-4">Product Info</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Pricing</th>
                      <th className="p-4">Badges</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-xs">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-neutral-850/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={getProductMainImage(p)}
                            alt={p.title}
                            className="w-10 h-10 object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-xs">{p.title}</p>
                            <p className="text-[10px] text-neutral-500">{p.brand} | ID: {p.id}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full uppercase border border-neutral-700/55">
                            {categories.find(c => c.id === p.category)?.name || p.category}
                          </span>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <p className="font-extrabold text-white">₹{p.price}</p>
                          <p className="text-[10px] text-neutral-500 line-through">₹{p.originalPrice}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {p.badges.seenInReel && <span className="text-[9px] bg-sky-950 border border-sky-900/50 text-sky-400 px-1.5 py-0.2 rounded font-medium">🎥 Reel</span>}
                            {p.badges.personallyTested && <span className="text-[9px] bg-emerald-950 border border-emerald-900/50 text-emerald-400 px-1.5 py-0.2 rounded font-medium">✅ Tested</span>}
                            {p.badges.recommended && <span className="text-[9px] bg-amber-950 border border-amber-900/50 text-amber-400 px-1.5 py-0.2 rounded font-medium">⭐ Fav</span>}
                            {p.badges.trending && <span className="text-[9px] bg-red-950 border border-red-900/50 text-red-400 px-1.5 py-0.2 rounded font-medium">🔥 Trending</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'Published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductFormOpen(true);
                              }}
                              className="p-1.5 bg-neutral-850 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 bg-red-950/35 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Category Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Categories Management</h3>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryFormOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(c => (
                <div key={c.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-[#FF5A00] shrink-0">
                      <CategoryIcon iconKey={c.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{c.name}</h4>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ID: {c.id} | Icon: {c.icon}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(c);
                        setCategoryFormOpen(true);
                      }}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(c.id)}
                      className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'launch' && (
          <AdminLaunchMode
            launchSettings={launchSettings}
            onSaveLaunchSettings={onSaveLaunchSettings}
          />
        )}

        {/* Promotional Banners Manager Tab */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 font-display">
                  <Megaphone className="w-4 h-4 text-[#FF5A00]" />
                  Promotional Banners Carousel ({promotionalBanners.length})
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Manage Flipkart-style promotional banner cards displayed on the homepage below Category Navigation.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingBanner(null);
                  setBannerFormOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Promotional Banner</span>
              </button>
            </div>

            {/* List of Banners Table / Cards */}
            {promotionalBanners.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center space-y-3">
                <Image className="w-10 h-10 text-neutral-600 mx-auto stroke-1" />
                <h4 className="text-sm font-bold text-neutral-300">No Promotional Banners Yet</h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Add your first promotional offer banner to showcase top deals, brand highlights, and discounts on your homepage.
                </p>
                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setBannerFormOpen(true);
                  }}
                  className="px-4 py-2 bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create First Banner
                </button>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-neutral-950 border-b border-neutral-800 text-[11px] uppercase font-bold text-neutral-400 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Order</th>
                        <th className="py-3 px-4">Banner Preview</th>
                        <th className="py-3 px-4">Banner Details</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Schedule</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                      {promotionalBanners
                        .slice()
                        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                        .map((b, idx, sortedArr) => {
                          const status = getBannerStatus(b);
                          return (
                            <tr key={b.id} className="hover:bg-neutral-850/50 transition-colors">
                              {/* Order & Reorder Controls */}
                              <td className="py-3 px-4 font-mono font-bold text-neutral-400">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-5 text-center">{b.displayOrder ?? idx + 1}</span>
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      disabled={idx === 0}
                                      onClick={() => {
                                        if (idx === 0) return;
                                        const newArr = [...sortedArr];
                                        const temp = newArr[idx];
                                        newArr[idx] = newArr[idx - 1];
                                        newArr[idx - 1] = temp;
                                        onReorderPromotionalBanners(newArr);
                                      }}
                                      className="p-1 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 hover:text-white rounded cursor-pointer"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      disabled={idx === sortedArr.length - 1}
                                      onClick={() => {
                                        if (idx === sortedArr.length - 1) return;
                                        const newArr = [...sortedArr];
                                        const temp = newArr[idx];
                                        newArr[idx] = newArr[idx + 1];
                                        newArr[idx + 1] = temp;
                                        onReorderPromotionalBanners(newArr);
                                      }}
                                      className="p-1 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 hover:text-white rounded cursor-pointer"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Preview Thumbnail */}
                              <td className="py-3 px-4">
                                <div className="w-28 h-12 rounded-xl bg-slate-950 border border-neutral-700/80 overflow-hidden relative group">
                                  <img
                                    src={b.imageUrl}
                                    alt={b.name}
                                    className="w-full h-full"
                                    style={{ objectFit: b.objectFit || 'contain' }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80';
                                    }}
                                  />
                                  <button
                                    onClick={() => setPreviewingBanner(b)}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Preview
                                  </button>
                                </div>
                              </td>

                              {/* Details */}
                              <td className="py-3 px-4">
                                <div className="space-y-0.5 max-w-xs">
                                  <h4 className="font-bold text-white text-xs truncate">{b.name}</h4>
                                  {b.title && <p className="text-[11px] text-emerald-400 font-medium truncate">Title: {b.title}</p>}
                                  {b.subtitle && <p className="text-[10px] text-neutral-400 truncate">{b.subtitle}</p>}
                                  <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                                    <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-1.5 py-0.5 rounded border border-neutral-700">
                                      📐 {b.bannerWidth || 585} × {b.bannerHeight || 282}
                                    </span>
                                    <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-1.5 py-0.5 rounded border border-neutral-700 truncate max-w-[150px]">
                                      🔗 {b.destinationUrl || 'None'}
                                    </span>
                                    {b.buttonText && (
                                      <span className="text-[10px] bg-[#FF5A00]/20 text-[#FF5A00] font-bold px-1.5 py-0.5 rounded border border-[#FF5A00]/30">
                                        CTA: {b.buttonText}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                    status === 'Active'
                                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                                      : status === 'Scheduled'
                                      ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
                                      : status === 'Expired'
                                      ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                      : 'bg-red-950/80 text-red-400 border-red-800/80'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      status === 'Active'
                                        ? 'bg-emerald-400 animate-pulse'
                                        : status === 'Scheduled'
                                        ? 'bg-amber-400'
                                        : status === 'Expired'
                                        ? 'bg-neutral-400'
                                        : 'bg-red-400'
                                    }`}
                                  />
                                  {status === 'Active' ? '🟢 Active' : status === 'Scheduled' ? '🟡 Scheduled' : status === 'Expired' ? '⚪ Expired' : '🔴 Inactive'}
                                </span>
                              </td>

                              {/* Schedule */}
                              <td className="py-3 px-4 text-[10px] text-neutral-400 font-mono space-y-0.5">
                                <div>
                                  <span className="text-neutral-500 font-bold">Start:</span>{' '}
                                  {b.startAt ? new Date(b.startAt).toLocaleString() : 'Immediate'}
                                </div>
                                <div>
                                  <span className="text-neutral-500 font-bold">End:</span>{' '}
                                  {b.endAt ? new Date(b.endAt).toLocaleString() : 'No Expiry'}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* ON / OFF Quick Toggle */}
                                  <button
                                    onClick={() => {
                                      onUpdatePromotionalBanner({
                                        ...b,
                                        isActive: !b.isActive,
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                      b.isActive
                                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-750'
                                    }`}
                                    title={b.isActive ? 'Turn OFF Banner' : 'Turn ON Banner'}
                                  >
                                    <Power className="w-3 h-3" />
                                    <span>{b.isActive ? 'ON' : 'OFF'}</span>
                                  </button>

                                  {/* Preview */}
                                  <button
                                    onClick={() => setPreviewingBanner(b)}
                                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                                    title="Live Preview"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => {
                                      setEditingBanner(b);
                                      setBannerFormOpen(true);
                                    }}
                                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Banner"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => setDeleteConfirmBannerId(b.id)}
                                    className="p-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Banner"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Engine Analytics Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FF5A00]/10 text-[#FF5A00] flex items-center justify-center font-bold">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-display">
                      Search Engine Analytics &amp; User Intent HQ
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Real-time analysis of user search queries, trending keywords, missing inventory zero-result searches, and click conversions.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoadingSearchAnalytics(true);
                    fetchSearchAnalyticsData()
                      .then(data => setSearchAnalyticsData(data))
                      .finally(() => setLoadingSearchAnalytics(false));
                  }}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                >
                  {loadingSearchAnalytics ? 'Refreshing...' : 'Refresh Logs'}
                </button>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 border border-neutral-800 rounded-2xl bg-neutral-900 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A00] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Total Searches Logged
                </span>
                <span className="text-2xl font-black text-white mt-2">
                  {searchAnalyticsData?.totalSearchesCount || 0}
                </span>
                <span className="text-[10px] text-neutral-400 mt-1">Live query tracking</span>
              </div>

              <div className="p-5 border border-neutral-800 rounded-2xl bg-neutral-900 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Search Conversion
                </span>
                <span className="text-2xl font-black text-emerald-400 mt-2">
                  {searchAnalyticsData?.searchConversionRate || 0}%
                </span>
                <span className="text-[10px] text-neutral-400 mt-1">% of searches resulting in product clicks</span>
              </div>

              <div className="p-5 border border-neutral-800 rounded-2xl bg-neutral-900 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Zero-Result Rate
                </span>
                <span className="text-2xl font-black text-red-400 mt-2">
                  {searchAnalyticsData?.zeroResultsRate || 0}%
                </span>
                <span className="text-[10px] text-neutral-400 mt-1">Searches yielding 0 catalog matches</span>
              </div>

              <div className="p-5 border border-neutral-800 rounded-2xl bg-neutral-900 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Top Keyword
                </span>
                <span className="text-xl font-black text-amber-400 mt-2 capitalize truncate">
                  {searchAnalyticsData?.topSearches?.[0]?.query || 'Microphone'}
                </span>
                <span className="text-[10px] text-neutral-400 mt-1">
                  {searchAnalyticsData?.topSearches?.[0]?.count || 0} search events
                </span>
              </div>
            </div>

            {/* TWO COLUMN GRID FOR TABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* TOP SEARCHED KEYWORDS */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#FF5A00]" />
                    Most Searched Keywords
                  </h4>
                  <span className="text-[10px] bg-[#FF5A00]/10 text-[#FF5A00] font-bold px-2 py-0.5 rounded-full">
                    Top Queries
                  </span>
                </div>

                <div className="divide-y divide-neutral-800/80">
                  {(searchAnalyticsData?.topSearches || []).map((item: any, idx: number) => (
                    <div key={`ts-${idx}`} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-neutral-500 w-4">{idx + 1}.</span>
                        <span className="font-bold text-white capitalize truncate">{item.query}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          {item.count} searches
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ZERO RESULT SEARCHES (MISSING INVENTORY OPPORTUNITIES) */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Zero Result Searches (Missing Inventory)
                  </h4>
                  <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full">
                    Stock Demands
                  </span>
                </div>

                <div className="divide-y divide-neutral-800/80">
                  {(searchAnalyticsData?.zeroResultSearches || []).length > 0 ? (
                    (searchAnalyticsData?.zeroResultSearches || []).map((item: any, idx: number) => (
                      <div key={`zr-${idx}`} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono text-neutral-500 w-4">{idx + 1}.</span>
                          <span className="font-bold text-red-300 capitalize truncate">{item.query}</span>
                        </div>
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md shrink-0">
                          {item.count} missed searches
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500 py-4 text-center">No zero-result searches logged yet.</p>
                  )}
                </div>
              </div>

            </div>

            {/* BRANDS & CATEGORIES BREAKDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* MOST SEARCHED BRANDS */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-white tracking-wider pb-2 border-b border-neutral-800 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  Most Searched Brands
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(searchAnalyticsData?.mostSearchedBrands || []).map((item: any, idx: number) => (
                    <div
                      key={`b-${idx}`}
                      className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-white">{item.brand}</span>
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MOST SEARCHED CATEGORIES */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-white tracking-wider pb-2 border-b border-neutral-800 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  Most Searched Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(searchAnalyticsData?.mostSearchedCategories || []).map((item: any, idx: number) => (
                    <div
                      key={`c-${idx}`}
                      className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-white">{item.category}</span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: MASTER RETAILERS MANAGER */}
        {activeTab === 'retailers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
              <div>
                <h3 className="text-base font-extrabold text-white font-display flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#FF5A00]" />
                  Master Retailer Platform Registry ({retailers.length})
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Manage master retailer brand profiles, logos, and platform statuses. Changes sync automatically across all product offer deals.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingRetailer(null);
                  setRetailerFormOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Master Retailer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {retailers.map(r => (
                <div key={r.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 relative group hover:border-neutral-700 transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      r.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {r.status}
                    </span>
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingRetailer(r);
                          setRetailerFormOpen(true);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                        title="Edit Retailer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmRetailerId(r.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 bg-neutral-800 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete Retailer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-xl p-2 flex items-center justify-center shrink-0">
                      <RetailerLogo retailerName={r.name} logoUrl={r.logoUrl} className="h-6 w-auto max-w-full" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate font-display">{r.name}</h4>
                      <p className="text-[10px] text-neutral-500 font-mono truncate">ID: {r.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: PRODUCT FORM */}
      <AnimatePresence>
        {productFormOpen && (
          <ProductFormModal
            product={editingProduct}
            categories={categories}
            existingProducts={products}
            onClose={() => setProductFormOpen(false)}
            onSave={(p) => {
              if (editingProduct) {
                onUpdateProduct(p);
              } else {
                onAddProduct(p);
              }
              setProductFormOpen(false);
            }}
            imagePresets={imagePresets}
          />
        )}
      </AnimatePresence>

      {/* MODAL: CATEGORY FORM */}
      <AnimatePresence>
        {categoryFormOpen && (
          <CategoryFormModal
            category={editingCategory}
            onClose={() => setCategoryFormOpen(false)}
            onSave={(c) => {
              if (editingCategory) {
                onUpdateCategory(c);
              } else {
                onAddCategory(c);
              }
              setCategoryFormOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL: PROMOTIONAL BANNER FORM */}
      <AnimatePresence>
        {bannerFormOpen && (
          <PromotionalBannerFormModal
            banner={editingBanner}
            categories={categories}
            products={products}
            displayOrderDefault={promotionalBanners.length + 1}
            onClose={() => setBannerFormOpen(false)}
            onSave={(b) => {
              if (editingBanner) {
                onUpdatePromotionalBanner(b);
              } else {
                onAddPromotionalBanner(b);
              }
              setBannerFormOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL: PROMOTIONAL BANNER PREVIEW */}
      <AnimatePresence>
        {previewingBanner && (
          <PromotionalBannerPreviewModal
            banner={previewingBanner}
            onClose={() => setPreviewingBanner(null)}
          />
        )}
      </AnimatePresence>

      {/* MODAL: DELETE BANNER CONFIRMATION */}
      <AnimatePresence>
        {deleteConfirmBannerId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-950/50 text-red-400 border border-red-900/60 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Promotional Banner?</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Are you sure you want to remove this promotional banner? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmBannerId(null)}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeletePromotionalBanner(deleteConfirmBannerId);
                    setDeleteConfirmBannerId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Delete Banner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RETAILER FORM */}
      <AnimatePresence>
        {retailerFormOpen && (
          <RetailerFormModal
            retailer={editingRetailer}
            onClose={() => setRetailerFormOpen(false)}
            onSave={(r) => {
              if (editingRetailer) {
                onUpdateRetailer?.(r);
              } else {
                onAddRetailer?.(r);
              }
              setRetailerFormOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL: DELETE RETAILER CONFIRMATION */}
      <AnimatePresence>
        {deleteConfirmRetailerId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-950/50 text-red-400 border border-red-900/60 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Master Retailer?</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Are you sure you want to remove this master retailer? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmRetailerId(null)}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmRetailerId) {
                      onDeleteRetailer?.(deleteConfirmRetailerId);
                      setDeleteConfirmRetailerId(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Delete Retailer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: ProductFormModal
// ---------------------------------------------------------
interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  existingProducts?: Product[];
  onClose: () => void;
  onSave: (product: Product) => void;
  imagePresets: string[];
}

function ProductFormModal({ product, categories, existingProducts = [], onClose, onSave, imagePresets }: ProductFormModalProps) {
  const [id, setId] = useState(product?.id || `prod-${Date.now()}`);
  const [title, setTitle] = useState(product?.title || '');
  const [price, setPrice] = useState(product?.price || 0);
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice || 0);
  const [description, setDescription] = useState(product?.description || '');
  const [whyIRecommend, setWhyIRecommend] = useState(product?.whyIRecommend || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [category, setCategory] = useState(product?.category || categories[0]?.id || 'desk-setup');
  const [rating, setRating] = useState(product?.rating || 4.5);
  
  // Multi-Image Product Gallery State
  const [productImages, setProductImages] = useState<string[]>(() => getProductImages(product));
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSetMainImage = (index: number) => {
    if (index <= 0 || index >= productImages.length) return;
    setProductImages(prev => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= productImages.length) return;
    setProductImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemoveImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddImageByUrl = () => {
    if (!newImageUrlInput.trim()) return;
    if (productImages.length >= 8) {
      setUploadError('Maximum limit of 8 images reached.');
      return;
    }
    setProductImages(prev => [...prev, newImageUrlInput.trim()]);
    setNewImageUrlInput('');
    setUploadError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const remainingSlots = 8 - productImages.length;
    if (remainingSlots <= 0) {
      setUploadError('Maximum limit of 8 product images reached.');
      return;
    }

    const filesToProcess = fileList.slice(0, remainingSlots);
    setIsUploadingImage(true);
    setUploadError(null);

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      setUploadProgressText(`Uploading ${i + 1} of ${filesToProcess.length}...`);

      if (!file.type.startsWith('image/')) {
        setUploadError(`File "${file.name}" is not a valid image file.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 10MB limit.`);
        continue;
      }

      try {
        const downloadUrl = await uploadFileToStorage(file, 'product-images');
        setProductImages(prev => [...prev, downloadUrl]);
      } catch (err) {
        console.warn('Storage upload fallback to local reader:', err);
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              setProductImages(prev => [...prev, ev.target!.result as string]);
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }

    setIsUploadingImage(false);
    setUploadProgressText('');
    e.target.value = '';
  };

  const handleSelectPreset = (presetUrl: string) => {
    if (productImages.length >= 8) {
      setUploadError('Maximum limit of 8 images reached.');
      return;
    }
    if (!productImages.includes(presetUrl)) {
      setProductImages(prev => [...prev, presetUrl]);
      setUploadError(null);
    }
  };
  // Retailer Offers state initialization (supports multi-retailer pricing)
  const [retailerOffers, setRetailerOffers] = useState<RetailerOffer[]>(() => {
    if (product) {
      const norm = getNormalizedRetailerOffers(product, true);
      if (norm.length > 0) return norm;
    }
    const defaultOrig = Number(product?.originalPrice) || Number(originalPrice) || 0;
    const defaultCur = Number(product?.price) || Number(price) || 0;
    return [
      {
        id: `offer-1-${Date.now()}`,
        retailerName: 'Amazon',
        productUrl: '',
        originalPrice: defaultOrig,
        offerPrice: defaultCur,
        discountPercent: calculateDiscountPercent(defaultOrig, defaultCur),
        isActive: true,
        displayOrder: 0,
      },
    ];
  });

  const [retailerOfferErrors, setRetailerOfferErrors] = useState<{
    [index: number]: { name?: string; url?: string; price?: string; origPrice?: string };
  }>({});

  const handleAddRetailerOffer = (presetName = '') => {
    setRetailerOffers(prev => [
      ...prev,
      {
        id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        retailerName: presetName,
        productUrl: '',
        originalPrice: Number(originalPrice) || Number(price) || 0,
        offerPrice: Number(price) || 0,
        discountPercent: calculateDiscountPercent(Number(originalPrice) || 0, Number(price) || 0),
        isActive: true,
        displayOrder: prev.length,
      },
    ]);
  };

  const handleRemoveRetailerOffer = (index: number) => {
    setRetailerOffers(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((offer, idx) => ({ ...offer, displayOrder: idx }));
    });
    setRetailerOfferErrors(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleToggleOfferActive = (index: number) => {
    setRetailerOffers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isActive: !copy[index].isActive };
      return copy;
    });
  };

  const handleMoveOffer = (index: number, direction: 'up' | 'down') => {
    setRetailerOffers(prev => {
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prev.length - 1)
      ) {
        return prev;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((o, idx) => ({ ...o, displayOrder: idx }));
    });
  };

  const handleOfferFieldChange = (
    index: number,
    field: keyof RetailerOffer,
    value: any
  ) => {
    setRetailerOffers(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      if (field === 'originalPrice' || field === 'offerPrice') {
        const orig = Number(field === 'originalPrice' ? value : item.originalPrice) || 0;
        const cur = Number(field === 'offerPrice' ? value : item.offerPrice) || 0;
        item.discountPercent = calculateDiscountPercent(orig, cur);
      }

      copy[index] = item;
      return copy;
    });

    // Clear field error on edit
    setRetailerOfferErrors(prev => {
      if (!prev[index]) return prev;
      const copy = { ...prev };
      if (copy[index]) {
        delete copy[index][field as 'name' | 'url' | 'price' | 'origPrice'];
      }
      return copy;
    });
  };

  // Photo / Video Links
  const [youtubeUrl, setYoutubeUrl] = useState(product?.youtubeUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(product?.instagramUrl || '');
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  const handleYoutubeChange = (val: string) => {
    setYoutubeUrl(val);
    const result = validateSocialUrl(val, 'youtube');
    setYoutubeError(result.isValid ? null : result.errorMessage || 'Invalid YouTube URL');
  };

  const handleInstagramChange = (val: string) => {
    setInstagramUrl(val);
    const result = validateSocialUrl(val, 'instagram');
    setInstagramError(result.isValid ? null : result.errorMessage || 'Invalid Instagram URL');
  };

  // Badges
  const [seenInReel, setSeenInReel] = useState<boolean>(product?.badges.seenInReel || false);
  const [personallyTested, setPersonallyTested] = useState<boolean>(product?.badges.personallyTested ?? true);
  const [recommended, setRecommended] = useState<boolean>(product?.badges.recommended ?? true);
  const [trending, setTrending] = useState<boolean>(product?.badges.trending || false);

  // Review
  const [reviewRating, setReviewRating] = useState<number | string>(product?.creatorReview?.rating ?? product?.rating ?? 5);
  const [reviewRatingError, setReviewRatingError] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState(product?.creatorReview.reviewText || '');
  const [unboxingText, setUnboxingText] = useState(product?.creatorReview.unboxingText || '');
  const [setupGuideText, setSetupGuideText] = useState(product?.creatorReview.setupGuideText || '');
  const [myExperience, setMyExperience] = useState(product?.creatorReview.myExperience || '');
  const [myVerdict, setMyVerdict] = useState(product?.creatorReview.myVerdict || '');

  // Lists
  const [prosText, setProsText] = useState(product?.pros.join('\n') || '');
  const [consText, setConsText] = useState(product?.cons.join('\n') || '');
  const [specText, setSpecText] = useState(product?.specifications.map(s => `${s.name}: ${s.value}`).join('\n') || 'Material: Plastic');

  // Search & SEO State
  const [searchTags, setSearchTags] = useState<string[]>(product?.searchTags || []);
  const [tagInput, setTagInput] = useState('');
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription || '');
  const [seoSlug, setSeoSlug] = useState(product?.seoSlug || '');
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  // Compute live effective slug & SEO Score Audit
  const effectiveSlug = generateUniqueSlug(title, id, existingProducts, seoSlug);
  const currentDomain = getDomain();
  const canonicalUrl = `${currentDomain}/product/${effectiveSlug}`;

  const effectiveImages = productImages.filter(Boolean);
  const finalImages = effectiveImages.length > 0 ? effectiveImages : ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'];

  const seoAudit = calculateProductSEOScore({
    title,
    description,
    seoTitle,
    seoDescription,
    seoSlug: effectiveSlug,
    searchTags,
    images: finalImages,
    brand,
    category
  });

  const handleAddTag = (str?: string) => {
    const raw = str !== undefined ? str : tagInput;
    if (!raw) return;
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    
    setSearchTags(prev => {
      const updated = [...prev];
      for (const part of parts) {
        if (!updated.some(t => t.toLowerCase() === part.toLowerCase())) {
          updated.push(part);
        }
      }
      return updated;
    });
    setTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    setSearchTags(prev => prev.filter((_, i) => i !== index));
  };

  const executeAutoGenerateSEO = () => {
    // 0. Generate SEO Slug
    const autoSlug = generateUniqueSlug(title, id, existingProducts, '');
    setSeoSlug(autoSlug);

    // 1. Generate Search Tags from product details
    const extractedWords: string[] = [];
    if (title) extractedWords.push(...title.split(/[\s,-]+/));
    if (brand) extractedWords.push(brand);
    if (category) extractedWords.push(category.replace('-', ' '));

    const cleanTags: string[] = [];
    if (title && title.trim()) {
      cleanTags.push(title.trim().toLowerCase());
    }
    for (const w of extractedWords) {
      const cleaned = w.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleaned.length > 2 && !['and', 'the', 'for', 'with', 'this', 'item', 'from'].includes(cleaned)) {
        if (!cleanTags.some(t => t.toLowerCase() === cleaned)) {
          cleanTags.push(cleaned);
        }
      }
    }
    setSearchTags(cleanTags.slice(0, 10));

    // 2. Generate SEO Title
    let generatedTitle = `${title.trim()}${brand ? ` by ${brand}` : ''} | On Budget`;
    if (generatedTitle.length > 60) {
      generatedTitle = `${title.trim()} | On Budget`;
      if (generatedTitle.length > 60) {
        generatedTitle = generatedTitle.substring(0, 57) + '...';
      }
    }
    setSeoTitle(generatedTitle);

    // 3. Generate SEO Description
    let sourceDesc = description.trim() || whyIRecommend.trim() || reviewText.trim() || `Buy ${title} at an affordable price on On Budget.`;
    if (sourceDesc.length > 160) {
      sourceDesc = sourceDesc.substring(0, 157) + '...';
    } else if (sourceDesc.length < 110 && whyIRecommend.trim()) {
      sourceDesc = `${sourceDesc} ${whyIRecommend.trim()}`;
      if (sourceDesc.length > 160) {
        sourceDesc = sourceDesc.substring(0, 157) + '...';
      }
    }
    setSeoDescription(sourceDesc);
  };

  const handleAutoGenerateSEO = () => {
    if (searchTags.length > 0 || seoTitle.trim() !== '' || seoDescription.trim() !== '' || seoSlug.trim() !== '') {
      setShowOverwriteWarning(true);
    } else {
      executeAutoGenerateSEO();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    if (finalImages.length === 0) {
      setUploadError('At least 1 product image is required.');
      return;
    }

    // Validate Social Media URLs before saving
    const ytVal = validateSocialUrl(youtubeUrl, 'youtube');
    const igVal = validateSocialUrl(instagramUrl, 'instagram');

    if (!ytVal.isValid) {
      setYoutubeError(ytVal.errorMessage || 'Invalid YouTube URL');
      return;
    }
    if (!igVal.isValid) {
      setInstagramError(igVal.errorMessage || 'Invalid Instagram URL');
      return;
    }

    let parsedRating = parseFloat(String(reviewRating));
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      setReviewRatingError('Rating must be between 1.0 and 5.0');
      return;
    }
    parsedRating = Math.round(parsedRating * 10) / 10;
    setReviewRatingError(null);

    // Validate Retailer Offers
    let hasOfferError = false;
    const newOfferErrors: typeof retailerOfferErrors = {};
    const validRetailerOffers: RetailerOffer[] = [];

    retailerOffers.forEach((offer, idx) => {
      const trimmedName = (offer.retailerName || '').trim();
      const trimmedUrl = (offer.productUrl || '').trim();
      const origPrice = Number(offer.originalPrice) || 0;
      const curPrice = Number(offer.offerPrice) || 0;

      if (trimmedName || trimmedUrl || curPrice > 0 || origPrice > 0) {
        const fieldErrs: { name?: string; url?: string; price?: string; origPrice?: string } = {};

        if (!trimmedName) {
          fieldErrs.name = 'Retailer Name is required.';
          hasOfferError = true;
        }

        if (!trimmedUrl) {
          fieldErrs.url = 'Product URL is required.';
          hasOfferError = true;
        } else {
          const valResult = validatePurchaseUrl(trimmedUrl);
          if (!valResult.isValid) {
            fieldErrs.url = valResult.errorMessage || 'Invalid HTTP/HTTPS URL format.';
            hasOfferError = true;
          }
        }

        if (curPrice <= 0) {
          fieldErrs.price = 'Offer price must be greater than ₹0.';
          hasOfferError = true;
        }

        if (origPrice > 0 && origPrice < curPrice) {
          fieldErrs.origPrice = 'MRP should be ≥ Offer price.';
          hasOfferError = true;
        }

        if (Object.keys(fieldErrs).length > 0) {
          newOfferErrors[idx] = fieldErrs;
        } else {
          validRetailerOffers.push({
            id: offer.id || `offer-${idx}-${Date.now()}`,
            retailerName: trimmedName,
            productUrl: formatUrl(trimmedUrl),
            originalPrice: origPrice || curPrice,
            offerPrice: curPrice,
            discountPercent: calculateDiscountPercent(origPrice || curPrice, curPrice),
            isActive: offer.isActive !== false,
            displayOrder: idx,
          });
        }
      }
    });

    if (hasOfferError) {
      setRetailerOfferErrors(newOfferErrors);
      return;
    }
    setRetailerOfferErrors({});

    // Determine overall Best Price and MRP across active retailer offers
    const activeValidOffers = validRetailerOffers.filter(o => o.isActive);
    let bestOfferPrice = Number(price) || 0;
    let bestOriginalPrice = Number(originalPrice) || bestOfferPrice;

    if (activeValidOffers.length > 0) {
      let lowestOffer = activeValidOffers[0];
      for (let i = 1; i < activeValidOffers.length; i++) {
        if (activeValidOffers[i].offerPrice < lowestOffer.offerPrice) {
          lowestOffer = activeValidOffers[i];
        }
      }
      bestOfferPrice = lowestOffer.offerPrice;
      bestOriginalPrice = lowestOffer.originalPrice;
    }

    const calculatedBestDiscount = calculateDiscountPercent(bestOriginalPrice, bestOfferPrice);

    // Backward compatibility: build purchaseLinks and affiliateLinks arrays
    const validPurchaseLinks: PurchaseLink[] = validRetailerOffers.map(o => ({
      name: o.retailerName,
      url: o.productUrl,
    }));
    const affiliateLinks: Product['affiliateLinks'] = validPurchaseLinks.map(l => ({
      platform: l.name,
      url: l.url,
    }));

    // Build product spec objects
    const specifications = specText.split('\n').filter(Boolean).map(line => {
      const parts = line.split(':');
      return {
        name: parts[0]?.trim() || 'Specification',
        value: parts[1]?.trim() || 'Detail'
      };
    });

    const newProduct: Product = {
      id,
      title,
      price: bestOfferPrice,
      originalPrice: bestOriginalPrice,
      discount: calculatedBestDiscount,
      retailerOffers: validRetailerOffers,
      description,
      whyIRecommend,
      brand,
      category,
      rating: parsedRating,
      images: finalImages,
      image: finalImages[0],
      videos: ['https://assets.mixkit.co/videos/preview/mixkit-working-with-various-tools-and-devices-on-desk-43301-large.mp4'],
      affiliateLinks,
      purchaseLinks: validPurchaseLinks,
      youtubeUrl: youtubeUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      badges: {
        seenInReel,
        personallyTested,
        recommended,
        trending
      },
      creatorReview: {
        rating: parsedRating,
        reviewText,
        unboxingText,
        setupGuideText,
        myExperience,
        myVerdict,
        photos: finalImages
      },
      pros: prosText.split('\n').filter(Boolean),
      cons: consText.split('\n').filter(Boolean),
      specifications,
      features: ['Sleek setup accent', 'High budget value'],
      couponCode: 'SAVEBUDGET',
      alternatives: [],
      frequentlyBoughtTogether: [],
      faqs: [
        { question: 'Is this high quality?', answer: 'Yes, it is personally curated and reviewed by the team.' }
      ],
      searchTags: searchTags.map(t => t.trim()).filter(Boolean),
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      seoSlug: effectiveSlug,
      status: 'Published',
      createdAt: product?.createdAt || new Date().toISOString()
    };

    onSave(newProduct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-4 bg-neutral-950 border-b border-neutral-850 flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {product ? 'Edit Product Curations' : 'Add New Budget Item'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-neutral-300">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-neutral-800 pb-1">Basic Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Portable Multi-Purpose Keyring Lamp"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g., GlowTek"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Price (INR ₹) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="e.g., 99"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Original MRP (INR ₹) *</label>
                <input
                  type="number"
                  required
                  value={originalPrice}
                  onChange={e => setOriginalPrice(Number(e.target.value))}
                  placeholder="e.g., 299"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Multiple Product Images Manager */}
          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div>
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <Image className="w-3.5 h-3.5" /> Product Image Gallery ({productImages.length} / 8)
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Upload up to 8 product photos. Image #1 is automatically set as the <span className="text-emerald-400 font-bold">MAIN / COVER</span> image.
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                {productImages.length} / 8
              </span>
            </div>

            {/* Selected Images Grid Previews */}
            {productImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {productImages.map((img, idx) => {
                  const isMain = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`relative group rounded-2xl overflow-hidden bg-neutral-950 border-2 transition-all p-1 flex flex-col justify-between ${
                        isMain
                          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="relative w-full h-24 rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center p-1">
                        <img
                          src={img}
                          alt={`Product photo ${idx + 1}`}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />

                        {/* Badge for Main Cover Image */}
                        {isMain ? (
                          <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                            MAIN IMAGE
                          </span>
                        ) : (
                          <span className="absolute top-1.5 left-1.5 bg-neutral-900/90 text-neutral-300 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                            #{idx + 1}
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-md cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action Controls for Reordering / Setting Main */}
                      <div className="flex items-center justify-between gap-1 pt-2 px-1">
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(idx)}
                            className="text-[9px] font-bold text-emerald-400 hover:text-white bg-emerald-950/80 hover:bg-emerald-600 border border-emerald-800/80 px-2 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            Set as Main
                          </button>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, 'left')}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Left / Forward"
                          >
                            <ArrowUp className="w-3 h-3 -rotate-90" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === productImages.length - 1}
                            onClick={() => handleMoveImage(idx, 'right')}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Right / Backward"
                          >
                            <ArrowDown className="w-3 h-3 -rotate-90" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-neutral-800 rounded-2xl text-center space-y-2">
                <Image className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400 font-medium">No product images added yet.</p>
                <p className="text-[10px] text-neutral-500">Upload or paste image URLs below to populate the gallery.</p>
              </div>
            )}

            {/* Inputs for Upload or Adding Image URLs */}
            {productImages.length < 8 && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      type="url"
                      value={newImageUrlInput}
                      onChange={e => setNewImageUrlInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageByUrl();
                        }
                      }}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageByUrl}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add URL
                    </button>
                  </div>

                  <label className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors text-center">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>

                {isUploadingImage && (
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-2 animate-pulse bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/50">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadProgressText || 'Uploading image to storage...'}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="text-xs text-red-400 font-medium bg-red-950/40 p-2.5 rounded-xl border border-red-900/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Presets Bar */}
            <div>
              <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                Or Click High-Quality Presets to Append:
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {imagePresets.map((preset, i) => (
                  <img
                    key={i}
                    onClick={() => handleSelectPreset(preset)}
                    src={preset}
                    alt="Preset"
                    className={`w-12 h-12 object-cover rounded-xl cursor-pointer border-2 transition-all ${
                      productImages.includes(preset)
                        ? 'border-emerald-500 scale-95 opacity-50'
                        : 'border-transparent hover:border-neutral-700'
                    }`}
                    referrerPolicy="no-referrer"
                    title="Click to add preset photo"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Retailer Offers & Purchase Links */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-2.5 gap-2">
              <div>
                <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <span>Retailer Offers & Pricing Links</span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Set prices & affiliate links for Amazon, Meesho, Flipkart, Myntra, etc. The lowest active offer automatically sets the product's Best Price.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddRetailerOffer()}
                  className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Retailer</span>
                </button>
              </div>
            </div>

            {/* Quick Add Preset Retailers */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-neutral-500 shrink-0">Quick Presets:</span>
              {['Amazon', 'Meesho', 'Flipkart', 'Myntra', 'Croma', 'Ajio', 'Nykaa'].map(preset => {
                const exists = retailerOffers.some(o => o.retailerName.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddRetailerOffer(preset)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      exists
                        ? 'bg-neutral-800/80 text-neutral-400 border-neutral-700/80 opacity-70'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/60 hover:border-emerald-500/50'
                    }`}
                  >
                    <PlatformLogo platformName={preset} className="h-3.5 w-auto max-w-[50px] object-contain shrink-0" />
                    <span>{preset}</span>
                    <Plus className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Retailer Offer List */}
            <div className="space-y-3">
              {retailerOffers.map((offer, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === retailerOffers.length - 1;
                const errs = retailerOfferErrors[idx] || {};
                const disc = calculateDiscountPercent(Number(offer.originalPrice) || 0, Number(offer.offerPrice) || 0);

                return (
                  <div
                    key={offer.id || idx}
                    className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                      offer.isActive
                        ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-950/50 border-neutral-900 opacity-60'
                    }`}
                  >
                    {/* Header Row: Retailer Icon/Name, Active Toggle, Order Actions, Delete */}
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                      <div className="flex items-center gap-2">
                        <PlatformLogo platformName={offer.retailerName || 'Offer'} className="h-5 w-auto max-w-[75px] object-contain shrink-0" />
                        <span className="text-xs font-extrabold text-white">
                          {offer.retailerName || `Retailer #${idx + 1}`}
                        </span>
                        {disc > 0 && offer.isActive && (
                          <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            {disc}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Active Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleOfferActive(idx)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            offer.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                          }`}
                          title={offer.isActive ? "Deactivate Offer" : "Activate Offer"}
                        >
                          <Power className="w-3 h-3" />
                          <span>{offer.isActive ? 'Active' : 'Inactive'}</span>
                        </button>

                        {/* Move Up/Down */}
                        <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
                          <button
                            type="button"
                            onClick={() => handleMoveOffer(idx, 'up')}
                            disabled={isFirst}
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOffer(idx, 'down')}
                            disabled={isLast}
                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRetailerOffer(idx)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
                          title="Delete Retailer Offer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Input Grid: Name, URL, Original Price, Offer Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Name */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                          Retailer Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          list="popular-platforms-list"
                          value={offer.retailerName}
                          onChange={e => handleOfferFieldChange(idx, 'retailerName', e.target.value)}
                          placeholder="e.g. Amazon, Meesho"
                          className={`w-full bg-neutral-900 border ${
                            errs.name ? 'border-red-500 focus:border-red-400' : 'border-neutral-800 focus:border-emerald-500'
                          } rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                        />
                        {errs.name && <p className="text-[10px] text-red-400 mt-0.5 font-medium">{errs.name}</p>}
                      </div>

                      {/* URL */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                          Product Buy URL <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="url"
                          value={offer.productUrl}
                          onChange={e => handleOfferFieldChange(idx, 'productUrl', e.target.value)}
                          placeholder="https://www.amazon.in/dp/..."
                          className={`w-full bg-neutral-900 border ${
                            errs.url ? 'border-red-500 focus:border-red-400' : 'border-neutral-800 focus:border-emerald-500'
                          } rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                        />
                        {errs.url && <p className="text-[10px] text-red-400 mt-0.5 font-medium">{errs.url}</p>}
                      </div>

                      {/* Original Price / MRP */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                          Original Price (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={offer.originalPrice || ''}
                          onChange={e => handleOfferFieldChange(idx, 'originalPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="MRP"
                          className={`w-full bg-neutral-900 border ${
                            errs.origPrice ? 'border-red-500' : 'border-neutral-800 focus:border-emerald-500'
                          } rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                        />
                        {errs.origPrice && <p className="text-[10px] text-red-400 mt-0.5 font-medium">{errs.origPrice}</p>}
                      </div>

                      {/* Offer Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-emerald-400 mb-1">
                          Offer Price (₹) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={offer.offerPrice || ''}
                          onChange={e => handleOfferFieldChange(idx, 'offerPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="Sale Price"
                          className={`w-full bg-neutral-900 border ${
                            errs.price ? 'border-red-500' : 'border-emerald-500/50 focus:border-emerald-400'
                          } rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none transition-colors`}
                        />
                        {errs.price && <p className="text-[10px] text-red-400 mt-0.5 font-medium">{errs.price}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}

              <datalist id="popular-platforms-list">
                <option value="Amazon" />
                <option value="Flipkart" />
                <option value="Meesho" />
                <option value="Myntra" />
                <option value="Ajio" />
                <option value="Croma" />
                <option value="Reliance Digital" />
                <option value="Tata CliQ" />
                <option value="Nykaa" />
                <option value="Snapdeal" />
                <option value="Official Website" />
              </datalist>
            </div>

            {/* Badges sub-section */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold text-neutral-400 mb-2">Configure Badges</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs cursor-pointer hover:bg-neutral-800 transition-colors">
                  <input type="checkbox" checked={seenInReel} onChange={e => setSeenInReel(e.target.checked)} className="accent-emerald-500" />
                  <span>Seen in Reel</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs cursor-pointer hover:bg-neutral-800 transition-colors">
                  <input type="checkbox" checked={personallyTested} onChange={e => setPersonallyTested(e.target.checked)} className="accent-emerald-500" />
                  <span>Tested</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs cursor-pointer hover:bg-neutral-800 transition-colors">
                  <input type="checkbox" checked={recommended} onChange={e => setRecommended(e.target.checked)} className="accent-emerald-500" />
                  <span>Recommended</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs cursor-pointer hover:bg-neutral-800 transition-colors">
                  <input type="checkbox" checked={trending} onChange={e => setTrending(e.target.checked)} className="accent-emerald-500" />
                  <span>Trending</span>
                </label>
              </div>
            </div>
          </div>

          {/* Photo / Video Links Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-neutral-800 pb-1">
              Photo / Video Links
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={e => handleYoutubeChange(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className={`w-full bg-neutral-950 border ${
                    youtubeError ? 'border-red-500 focus:border-red-400' : 'border-neutral-800 focus:border-emerald-500'
                  } rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                />
                {youtubeError && (
                  <p className="text-[10px] text-red-400 font-semibold mt-1">
                    {youtubeError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                  Instagram Reel/Post URL
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={e => handleInstagramChange(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className={`w-full bg-neutral-950 border ${
                    instagramError ? 'border-red-500 focus:border-red-400' : 'border-neutral-800 focus:border-emerald-500'
                  } rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                />
                {instagramError && (
                  <p className="text-[10px] text-red-400 font-semibold mt-1">
                    {instagramError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-neutral-800 pb-1">Reviews & Recommendations</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Short Description *</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Summarize the budget product features..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Why I Recommend It (The Hook)</label>
                <textarea
                  rows={2}
                  value={whyIRecommend}
                  onChange={e => setWhyIRecommend(e.target.value)}
                  placeholder="Explain why this budget item stands out..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Creator Hub */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-neutral-800 pb-1">Creator Review & Experience</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Creator Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={reviewRating}
                  onChange={e => {
                    const valStr = e.target.value;
                    setReviewRating(valStr);
                    const val = parseFloat(valStr);
                    if (valStr !== '' && (isNaN(val) || val < 1 || val > 5)) {
                      setReviewRatingError('Rating must be between 1.0 and 5.0');
                    } else {
                      setReviewRatingError(null);
                    }
                  }}
                  onBlur={() => {
                    const val = parseFloat(String(reviewRating));
                    if (isNaN(val) || val < 1) {
                      setReviewRating(1);
                      setReviewRatingError(null);
                    } else if (val > 5) {
                      setReviewRating(5);
                      setReviewRatingError(null);
                    } else {
                      const rounded = Math.round(val * 10) / 10;
                      setReviewRating(rounded);
                      setReviewRatingError(null);
                    }
                  }}
                  className={`w-full bg-neutral-950 border ${
                    reviewRatingError ? 'border-red-500 focus:border-red-400' : 'border-neutral-800 focus:border-emerald-500'
                  } rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                />
                {reviewRatingError && (
                  <p className="text-[10px] text-red-400 font-semibold mt-1">
                    {reviewRatingError}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Written Review Text</label>
                <textarea
                  rows={2}
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Write a deep dive editorial review..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Unboxing Experience</label>
                <textarea
                  rows={2}
                  value={unboxingText}
                  onChange={e => setUnboxingText(e.target.value)}
                  placeholder="What was inside the box..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Setup Guide</label>
                <textarea
                  rows={2}
                  value={setupGuideText}
                  onChange={e => setSetupGuideText(e.target.value)}
                  placeholder="Step by step preparation guide..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">My Personal Experience</label>
                <textarea
                  rows={2}
                  value={myExperience}
                  onChange={e => setMyExperience(e.target.value)}
                  placeholder="My weeks of usage, what I liked..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">My Verdict</label>
                <textarea
                  rows={1}
                  value={myVerdict}
                  onChange={e => setMyVerdict(e.target.value)}
                  placeholder="Final yes/no buying decision..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Lists (Pros, Cons, Specs) */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-neutral-800 pb-1">Technical Specs, Pros, Cons</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-emerald-300 mb-1">Pros (One per line)</label>
                <textarea
                  rows={3}
                  value={prosText}
                  onChange={e => setProsText(e.target.value)}
                  placeholder="Super premium feel&#10;Highly durable material"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-300 mb-1">Cons (One per line)</label>
                <textarea
                  rows={3}
                  value={consText}
                  onChange={e => setConsText(e.target.value)}
                  placeholder="Only 1 color option&#10;Slightly short cord"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Specifications (Format: Name: Value, one per line)</label>
                <textarea
                  rows={3}
                  value={specText}
                  onChange={e => setSpecText(e.target.value)}
                  placeholder="Material: Liquid Silicone&#10;Dimensions: 15cm x 5cm&#10;Battery life: 10 hours"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 6: SEARCH & SEO */}
          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Search & SEO</span>
              </h4>
              <button
                type="button"
                onClick={handleAutoGenerateSEO}
                className="text-[10px] font-bold bg-neutral-800 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg border border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Auto-generate SEO title, description, and tags from product details"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Generate SEO</span>
              </button>
            </div>

            {/* Overwrite Confirmation banner */}
            {showOverwriteWarning && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-center justify-between">
                <span>Auto-generating will overwrite current SEO fields. Proceed?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      executeAutoGenerateSEO();
                      setShowOverwriteWarning(false);
                    }}
                    className="bg-amber-500 text-black font-bold px-2.5 py-0.5 rounded text-[10px] hover:bg-amber-400 cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOverwriteWarning(false)}
                    className="text-neutral-400 hover:text-white text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* A. SEO URL SLUG */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-neutral-300">
                  SEO URL Slug
                </label>
                <button
                  type="button"
                  onClick={() => setSeoSlug(slugify(title))}
                  className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  Auto-generate from Title
                </button>
              </div>
              <input
                type="text"
                value={seoSlug}
                onChange={(e) => setSeoSlug(e.target.value)}
                onBlur={() => {
                  if (seoSlug.trim()) {
                    setSeoSlug(slugify(seoSlug));
                  }
                }}
                placeholder="e.g. maono-au-400-lavalier-microphone"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Active slug: <span className="font-mono text-emerald-400 font-bold">{effectiveSlug}</span>
              </p>
            </div>

            {/* B. SEARCH TAGS */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                Search Tags
              </label>
              <div className="bg-neutral-950 border border-neutral-800 focus-within:border-emerald-500 rounded-xl p-2 transition-colors">
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {searchTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold px-2.5 py-0.5 rounded-lg font-display"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="text-emerald-400 hover:text-red-400 p-0.5 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="e.g. study lamp, LED lamp, desk lamp, rechargeable"
                    className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-700 shrink-0 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Press Enter or comma to create tags. Multiple tags power search keyword matches.
              </p>
            </div>

            {/* B. SEO TITLE */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-neutral-300">
                  SEO Title
                </label>
                <span className={`text-[10px] font-mono ${seoTitle.length > 60 ? 'text-amber-400 font-bold' : 'text-neutral-500'}`}>
                  {seoTitle.length} / 60
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Enter SEO-friendly title"
                className={`w-full bg-neutral-950 border ${seoTitle.length > 60 ? 'border-amber-500/60 focus:border-amber-400' : 'border-neutral-800 focus:border-emerald-500'} rounded-xl px-3 py-2 text-xs text-white focus:outline-none`}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-neutral-500">
                  Recommended: keep under 60 characters for search engines.
                </p>
                {seoTitle.length > 60 && (
                  <span className="text-[10px] text-amber-400 font-medium">
                    ⚠️ Exceeds 60 characters recommendation
                  </span>
                )}
              </div>
            </div>

            {/* C. SEO DESCRIPTION */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-neutral-300">
                  SEO Description
                </label>
                <span className={`text-[10px] font-mono ${seoDescription.length > 160 ? 'text-amber-400 font-bold' : 'text-neutral-500'}`}>
                  {seoDescription.length} / 160
                </span>
              </div>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Write a short description for search engines..."
                className={`w-full bg-neutral-950 border ${seoDescription.length > 160 ? 'border-amber-500/60 focus:border-amber-400' : 'border-neutral-800 focus:border-emerald-500'} rounded-xl px-3 py-2 text-xs text-white focus:outline-none`}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-neutral-500">
                  Recommended: around 150–160 characters.
                </p>
                {seoDescription.length > 160 && (
                  <span className="text-[10px] text-amber-400 font-medium">
                    ⚠️ Exceeds 160 characters recommendation
                  </span>
                )}
              </div>
            </div>

            {/* D. GOOGLE SEARCH PREVIEW & CANONICAL LINKS */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-3">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Search className="w-3 h-3 text-sky-400" />
                  <span>Google Search Preview</span>
                </div>
                <a
                  href={`/product/${effectiveSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview Page</span>
                </a>
              </div>
              
              <div className="space-y-1 font-sans bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-black text-[8px] font-bold flex items-center justify-center shrink-0 font-display">
                    OB
                  </div>
                  <span className="truncate text-neutral-400">{canonicalUrl}</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#8ab4f8] hover:underline cursor-pointer truncate">
                  {seoTitle.trim() || (title.trim() ? `${title} | On Budget` : 'Product Title | On Budget')}
                </div>
                <p className="text-[11px] text-[#bdc1c6] line-clamp-2 leading-relaxed">
                  {seoDescription.trim() || (description.trim() ? description : 'Discover top budget gadgets, personal tests, and curated deals on On Budget.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 font-semibold block uppercase">Canonical URL (Auto)</span>
                  <span className="text-emerald-400 font-mono truncate block mt-0.5">{canonicalUrl}</span>
                </div>
                <div className="bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 font-semibold block uppercase">Preview Link</span>
                  <span className="text-sky-400 font-mono truncate block mt-0.5">/product/{effectiveSlug}</span>
                </div>
              </div>
            </div>

            {/* E. LIVE SEO SCORE & DIAGNOSTIC HEALTH */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">SEO Score & Health Audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-semibold">Target: 100/100</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full font-mono ${
                    seoAudit.score >= 90
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : seoAudit.score >= 70
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {seoAudit.score} / 100
                  </span>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850">
                  <span className="text-neutral-500 font-medium block">Title Length</span>
                  <span className={`font-mono font-bold ${
                    seoAudit.titleStatus === 'good' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {seoAudit.titleLength} chars ({seoAudit.titleStatus})
                  </span>
                </div>

                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850">
                  <span className="text-neutral-500 font-medium block">Meta Desc Length</span>
                  <span className={`font-mono font-bold ${
                    seoAudit.descriptionStatus === 'good' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {seoAudit.descriptionLength} chars ({seoAudit.descriptionStatus})
                  </span>
                </div>

                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850">
                  <span className="text-neutral-500 font-medium block">Missing Fields</span>
                  <span className={`font-mono font-bold ${
                    seoAudit.missingFields.length === 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {seoAudit.missingFields.length} missing
                  </span>
                </div>

                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850">
                  <span className="text-neutral-500 font-medium block">Warnings</span>
                  <span className={`font-mono font-bold ${
                    seoAudit.warnings.length === 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {seoAudit.warnings.length} warnings
                  </span>
                </div>
              </div>

              {/* Missing Fields & Warnings Detail */}
              {(seoAudit.missingFields.length > 0 || seoAudit.warnings.length > 0) && (
                <div className="space-y-1.5 pt-1">
                  {seoAudit.missingFields.length > 0 && (
                    <div className="text-[10px] text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-2">
                      <span className="font-bold block mb-0.5">Missing SEO Fields:</span>
                      <p className="font-mono text-red-300">{seoAudit.missingFields.join(', ')}</p>
                    </div>
                  )}

                  {seoAudit.warnings.map((warn, i) => (
                    <div key={i} className="text-[10px] text-amber-300 bg-amber-950/20 border border-amber-900/40 rounded-lg p-1.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-6 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Save Product
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: CategoryFormModal
// ---------------------------------------------------------
interface CategoryFormModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: (category: Category) => void;
}

function CategoryFormModal({ category, onClose, onSave }: CategoryFormModalProps) {
  const [id, setId] = useState(category?.id || `cat-${Date.now()}`);
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'Layout');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ id, name, icon });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-300 space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {category ? 'Edit Category' : 'Create Category'}
          </h3>
          <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Category Code ID (no spaces)</label>
            <input
              type="text"
              required
              disabled={!!category}
              value={id}
              onChange={e => setId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="e.g., smart-gadgets"
              className="w-full bg-neutral-950 border border-neutral-800 disabled:opacity-50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Smart Gadgets"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Lucide Icon Key</label>
            <div className="flex items-center gap-2">
              <select
                value={icon}
                onChange={e => setIcon(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                {CATEGORY_ICON_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Visual Icon Preview */}
              <div className="w-10 h-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-[#FF5A00] shrink-0" title={`Selected Preview: ${icon}`}>
                <CategoryIcon iconKey={icon} className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">Live Preview: {icon}</p>
          </div>

          <div className="pt-2 border-t border-neutral-850 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3.5 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-5 py-2 rounded-xl font-bold"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: ReelFormModal
// ---------------------------------------------------------
interface ReelFormModalProps {
  reel: Reel | null;
  products: Product[];
  categories: Category[];
  onClose: () => void;
  onSave: (reel: Reel) => void;
  imagePresets: string[];
}

function ReelFormModal({ reel, products, categories, onClose, onSave, imagePresets }: ReelFormModalProps) {
  const [id, setId] = useState(reel?.id || `reel-${Date.now()}`);
  const [title, setTitle] = useState(reel?.title || '');
  const [platform, setPlatform] = useState<Reel['platform']>(reel?.platform || 'Instagram');
  const [thumbnailUrl, setThumbnailUrl] = useState(reel?.thumbnailUrl || '');
  const [category, setCategory] = useState(reel?.category || categories[0]?.id || 'desk-setup');
  const [productId, setProductId] = useState(reel?.productId || products[0]?.id || '');
  const [likes, setLikes] = useState(reel?.likes || 1500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !thumbnailUrl) return;

    onSave({
      id,
      title,
      platform,
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-working-with-various-tools-and-devices-on-desk-43301-large.mp4',
      thumbnailUrl,
      category,
      productId,
      likes,
      shares: Math.round(likes * 0.3)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-300 space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {reel ? 'Edit Vertical Reel' : 'Add Vertical Reel'}
          </h3>
          <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Reel Video Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Unboxing the viral star lights under ₹500!"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 mb-1">Platform</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as Reel['platform'])}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Instagram">Instagram Reel</option>
                <option value="YouTube">YouTube Short</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 mb-1">Interactive Target Product</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Likes Count</label>
            <input
              type="number"
              value={likes}
              onChange={e => setLikes(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Thumbnail Image URL</label>
            <input
              type="url"
              required
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
            <div className="flex gap-2 overflow-x-auto pt-2 scrollbar-thin">
              {imagePresets.slice(0, 4).map((p, i) => (
                <img
                  key={i}
                  onClick={() => setThumbnailUrl(p)}
                  src={p}
                  alt="preset"
                  className="w-10 h-10 object-cover rounded-lg cursor-pointer border hover:border-emerald-500"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-850 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3.5 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-5 py-2 rounded-xl font-bold"
            >
              Save Reel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: PromotionalBannerFormModal
// ---------------------------------------------------------
interface PromotionalBannerFormModalProps {
  banner: PromotionalBanner | null;
  categories: Category[];
  products: Product[];
  displayOrderDefault: number;
  onClose: () => void;
  onSave: (banner: PromotionalBanner) => Promise<void> | void;
}

function PromotionalBannerFormModal({
  banner,
  categories,
  products,
  displayOrderDefault,
  onClose,
  onSave,
}: PromotionalBannerFormModalProps) {
  const [id] = useState(banner?.id || `banner-${Date.now()}`);
  const [name, setName] = useState(banner?.name || '');
  const [imageUrl, setImageUrl] = useState(
    banner?.imageUrl ||
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1200&auto=format&fit=crop&q=80'
  );
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [buttonText, setButtonText] = useState(banner?.buttonText || '');
  const [destinationUrl, setDestinationUrl] = useState(banner?.destinationUrl || '');
  const [displayOrder, setDisplayOrder] = useState<number>(banner?.displayOrder ?? displayOrderDefault);
  const [isActive, setIsActive] = useState<boolean>(banner?.isActive ?? true);
  const [startAt, setStartAt] = useState(banner?.startAt || '');
  const [endAt, setEndAt] = useState(banner?.endAt || '');

  // Aspect ratio & object fit settings
  const [bannerWidth, setBannerWidth] = useState<number>(banner?.bannerWidth || 585);
  const [bannerHeight, setBannerHeight] = useState<number>(banner?.bannerHeight || 282);
  const [aspectRatioPreset, setAspectRatioPreset] = useState<'585x282' | '1771x835' | '16x9' | 'custom'>(
    banner?.aspectRatioPreset ||
      (banner?.bannerWidth === 1771 && banner?.bannerHeight === 835
        ? '1771x835'
        : banner?.bannerWidth === 16 && banner?.bannerHeight === 9
        ? '16x9'
        : '585x282')
  );
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>(banner?.objectFit || 'contain');

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImgDims, setUploadedImgDims] = useState<{ width: number; height: number } | null>(null);
  const [aspectWarning, setAspectWarning] = useState<string>('');

  // Handle Preset Changes
  const handlePresetChange = (preset: '585x282' | '1771x835' | '16x9' | 'custom') => {
    setAspectRatioPreset(preset);
    if (preset === '585x282') {
      setBannerWidth(585);
      setBannerHeight(282);
    } else if (preset === '1771x835') {
      setBannerWidth(1771);
      setBannerHeight(835);
    } else if (preset === '16x9') {
      setBannerWidth(16);
      setBannerHeight(9);
    }
  };

  // Inspect image dimensions and check aspect ratio
  useEffect(() => {
    if (!imageUrl || !imageUrl.trim()) {
      setUploadedImgDims(null);
      setAspectWarning('');
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      if (img.width && img.height) {
        setUploadedImgDims({ width: img.width, height: img.height });
        const imgRatio = img.width / img.height;
        const targetW = bannerWidth && bannerWidth > 0 ? bannerWidth : 585;
        const targetH = bannerHeight && bannerHeight > 0 ? bannerHeight : 282;
        const targetRatio = targetW / targetH;
        const diff = Math.abs(imgRatio - targetRatio);
        if (diff > 0.08) {
          setAspectWarning(
            'Image aspect ratio differs from the selected banner ratio. The image may have empty space or require cropping depending on the selected display mode.'
          );
        } else {
          setAspectWarning('');
        }
      }
    };
    img.onerror = () => {
      setUploadedImgDims(null);
      setAspectWarning('');
    };
    img.src = imageUrl;
  }, [imageUrl, bannerWidth, bannerHeight]);

  const presetBanners = [
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&auto=format&fit=crop&q=80',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, etc.).');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    setUploadProgressText('Optimizing image & preparing upload...');

    try {
      const downloadUrl = await uploadFileToStorage(file, 'banner-images', (_percent, statusText) => {
        setUploadProgressText(statusText);
      });
      setImageUrl(downloadUrl);
      setUploadProgressText('Image uploaded successfully!');
      setTimeout(() => setUploadProgressText(''), 2500);
    } catch (err: any) {
      console.error('Banner image upload error:', err);
      const errMsg = err?.message || 'Poster image upload failed. Please check your connection and try again.';
      alert(`${errMsg}\n\nNote: You can also paste an image URL directly into the field below.`);
      setUploadProgressText('');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert('Please enter a Banner Internal Name.');
      return;
    }
    if (!imageUrl.trim()) {
      alert('Please provide a Banner Image URL or upload an image.');
      return;
    }
    if (isUploadingImage) {
      alert('Please wait until image upload completes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id,
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        buttonText: buttonText.trim(),
        destinationUrl: destinationUrl.trim(),
        displayOrder: Number(displayOrder) || 1,
        isActive,
        startAt,
        endAt,
        bannerWidth: Number(bannerWidth) || 585,
        bannerHeight: Number(bannerHeight) || 282,
        aspectRatioPreset,
        objectFit,
        createdAt: banner?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save promotional banner:', err);
      alert(`Failed to save promotional banner: ${err?.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRatioNum = (bannerWidth && bannerHeight && bannerHeight > 0) ? (bannerWidth / bannerHeight) : (585 / 282);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 text-neutral-300 space-y-5 my-8"
      >
        <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#FF5A00]" />
              {banner ? 'Edit Promotional Banner' : 'Add Promotional Banner'}
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Configure banner visuals, size ratio, scheduling, destination links, and CTA overlay.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Banner Name & Active Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                Banner Internal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mini LED 4K TV Freedom Sale"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                Status Toggle
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:bg-emerald-900/80'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isActive ? 'ACTIVE (ON)' : 'INACTIVE (OFF)'}</span>
              </button>
            </div>
          </div>

          {/* Banner Size / Aspect Ratio & Object Fit Controls */}
          <div className="p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
              <div>
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Banner Size / Aspect Ratio</span>
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Select predefined display ratio or set custom width and height.
                </p>
              </div>
              <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg shrink-0">
                Current: <strong className="text-white">{bannerWidth || 585} : {bannerHeight || 282}</strong> ({currentRatioNum.toFixed(2)}:1)
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-300">
                Preset Options
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '585x282', label: 'Default / Wide', ratio: '585 × 282 (2.07:1)' },
                  { id: '1771x835', label: 'Ultra Wide', ratio: '1771 × 835 (2.12:1)' },
                  { id: '16x9', label: 'Standard Wide', ratio: '16 : 9 (1.78:1)' },
                  { id: 'custom', label: 'Custom', ratio: 'Enter W × H' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetChange(preset.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      aspectRatioPreset === preset.id
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold shadow-xs'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">{preset.ratio}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Width & Height Inputs */}
            {aspectRatioPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bannerWidth || ''}
                    onChange={(e) => setBannerWidth(Math.max(1, Number(e.target.value)))}
                    placeholder="e.g. 1200"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bannerHeight || ''}
                    onChange={(e) => setBannerHeight(Math.max(1, Number(e.target.value)))}
                    placeholder="e.g. 500"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Object Fit & Dimension Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Object Fit Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setObjectFit('contain')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      objectFit === 'contain'
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Contain (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setObjectFit('cover')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      objectFit === 'cover'
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Cover (Crop)
                  </button>
                </div>
              </div>

              {/* Dimension Status Box */}
              <div className="flex flex-col justify-center bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-neutral-400 font-bold mb-0.5">Image Dimension Check:</span>
                <div className="text-[11px] font-mono">
                  {uploadedImgDims ? (
                    <span className="text-neutral-200">
                      Uploaded image: <strong>{uploadedImgDims.width} × {uploadedImgDims.height} px</strong>
                    </span>
                  ) : (
                    <span className="text-neutral-500 italic">Measuring image...</span>
                  )}
                </div>
                {uploadedImgDims && (
                  <div className="mt-1">
                    {Math.abs((uploadedImgDims.width / uploadedImgDims.height) - currentRatioNum) <= 0.08 ? (
                      <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>✓ Perfect aspect ratio</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Ratio difference detected</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Image URL & File Upload */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-neutral-300">
                Banner Image *
              </label>
              <label className={`text-[10px] px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold ${
                isUploadingImage
                  ? 'bg-neutral-900 text-neutral-500 border-neutral-800 cursor-not-allowed'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 cursor-pointer'
              }`}>
                {isUploadingImage ? <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" /> : <Upload className="w-3 h-3" />}
                <span>{isUploadingImage ? 'Uploading...' : 'Upload Local File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadProgressText && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 animate-pulse font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {uploadProgressText}
              </p>
            )}

            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL (https://...)"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />

            {aspectWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-[11px] flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>{aspectWarning}</span>
              </div>
            )}

            {/* Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1">
              <span className="text-[10px] text-neutral-500 shrink-0 font-bold">Presets:</span>
              {presetBanners.map((p, idx) => (
                <img
                  key={idx}
                  src={p}
                  alt={`preset-${idx}`}
                  onClick={() => setImageUrl(p)}
                  className={`w-14 h-8 object-cover rounded-lg cursor-pointer border hover:scale-105 transition-all shrink-0 ${
                    imageUrl === p ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Banner Card Text Overlay Fields */}
          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-2xl space-y-3">
            <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Overlay Copy & Call To Action (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                  Headline Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mini LED 4K Smart TVs"
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                  Sub-headline / Offer Details
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g., From ₹24,999 | Card Discounts"
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g., Explore TV Offers"
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                  Destination Category / URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="e.g., tv-audio-video or https://..."
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) setDestinationUrl(e.target.value);
                    }}
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2 text-xs focus:outline-none shrink-0 cursor-pointer"
                  >
                    <option value="">Quick Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                Display Order Position
              </label>
              <input
                type="number"
                min="1"
                required
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-500" />
                <span>Start Date & Time (Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-500" />
                <span>End Date & Time (Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Live Card Preview Box */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-neutral-400">
                Live Banner Preview Card ({bannerWidth || 585} × {bannerHeight || 282} ratio)
              </label>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                Fit: {objectFit}
              </span>
            </div>
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-neutral-700 shadow-md flex items-center justify-center transition-all duration-300"
              style={{ aspectRatio: `${bannerWidth || 585} / ${bannerHeight || 282}` }}
            >
              <img
                src={imageUrl}
                alt="preview"
                className="w-full h-full transition-all duration-300"
                style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: `${bannerWidth || 585} / ${bannerHeight || 282}`,
                  objectFit: objectFit,
                  objectPosition: 'center',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1800&auto=format&fit=crop&q=80';
                }}
              />
              {(title || subtitle || buttonText) && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent flex items-center p-3 sm:p-5 pointer-events-none">
                  <div className="space-y-1 text-white">
                    {title && <h3 className="text-xs sm:text-base font-black font-display">{title}</h3>}
                    {subtitle && <p className="text-[10px] sm:text-xs text-slate-200">{subtitle}</p>}
                    {buttonText && (
                      <span className="inline-block px-2.5 py-1 bg-[#FF5A00] text-white text-[9px] sm:text-[10px] font-bold rounded-lg mt-0.5 font-display">
                        {buttonText}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 text-center pt-1">
              Current banner ratio: <strong>{bannerWidth || 585} : {bannerHeight || 282}</strong> (Aspect ratio: {currentRatioNum.toFixed(2)}:1)
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting || isUploadingImage}
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting || isUploadingImage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isSubmitting ? 'Saving Banner...' : 'Uploading Image...'}</span>
                </>
              ) : (
                <span>Save Banner</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: PromotionalBannerPreviewModal
// ---------------------------------------------------------
interface PromotionalBannerPreviewModalProps {
  banner: PromotionalBanner;
  onClose: () => void;
}

function PromotionalBannerPreviewModal({ banner, onClose }: PromotionalBannerPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 text-neutral-300 space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FF5A00]" />
              Live Interactive Banner Preview
            </h3>
            <p className="text-xs text-neutral-400">
              Previewing: <span className="text-white font-bold">{banner.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2">
          <PromotionalCarousel banners={[banner]} />
        </div>

        <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-xs">
          <div className="text-[11px] text-neutral-400 font-mono">
            Destination: <span className="text-emerald-400">{banner.destinationUrl || 'None'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: RetailerFormModal
// ---------------------------------------------------------
interface RetailerFormModalProps {
  retailer: Retailer | null;
  onClose: () => void;
  onSave: (retailer: Retailer) => void;
}

function RetailerFormModal({ retailer, onClose, onSave }: RetailerFormModalProps) {
  const [id, setId] = useState(retailer?.id || '');
  const [name, setName] = useState(retailer?.name || '');
  const [logoUrl, setLogoUrl] = useState(retailer?.logoUrl || '');
  const [status, setStatus] = useState<'active' | 'disabled'>(retailer?.status || 'active');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!retailer) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setId(slug);
      if (!logoUrl || logoUrl.startsWith('/assets/retailers/')) {
        setLogoUrl(`/assets/retailers/${slug}.svg`);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const url = await uploadFileToStorage(file, 'retailer-logos');
      setLogoUrl(url);
    } catch (err: any) {
      setUploadError('Failed to upload logo: ' + (err?.message || 'Storage error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalId = id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || `ret-${Date.now()}`;
    onSave({
      id: finalId,
      name: name.trim(),
      logoUrl: logoUrl.trim() || '/assets/retailers/default.svg',
      status,
      updatedAt: new Date().toISOString(),
      createdAt: retailer?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 text-neutral-300 space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Store className="w-4 h-4 text-[#FF5A00]" />
              {retailer ? 'Edit Master Retailer' : 'Add New Master Retailer'}
            </h3>
            <p className="text-xs text-neutral-400">Configure brand profile & official logo asset.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Retailer Display Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Reliance Digital"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF5A00]"
            />
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Retailer ID / Slug (Unique Key)</label>
            <input
              type="text"
              required
              disabled={!!retailer}
              placeholder="e.g. reliancedigital"
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF5A00] font-mono text-[11px] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Retailer Logo Asset / Image URL</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="/assets/retailers/reliancedigital.svg or Firebase Storage URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF5A00]"
              />

              <div className="flex items-center gap-3">
                <label className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-xl cursor-pointer text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#FF5A00]" />
                  Upload Custom Logo
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {isUploading && <span className="text-[11px] text-amber-400 font-semibold">Uploading...</span>}
              </div>
              {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Live Logo Preview</label>
            <div className="w-full h-16 bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-center">
              <RetailerLogo retailerName={name || 'Preview'} logoUrl={logoUrl} className="h-8 w-auto max-w-full" />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Platform Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF5A00]"
            >
              <option value="active">Active (Visible in Deal Picks)</option>
              <option value="disabled">Disabled (Hidden)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !name.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Save Retailer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

