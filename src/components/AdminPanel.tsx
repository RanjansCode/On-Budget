/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ShieldAlert, LayoutDashboard, ShoppingBag, FolderOpen, Film, Plus, Edit2, Trash2,
  TrendingUp, MousePointer, Share2, DollarSign, Upload, Info, Check, Eye, HelpCircle, Save, X,
  SlidersHorizontal, Search, Sparkles
} from 'lucide-react';
import { Product, Category, Reel, AnalyticsData, PurchaseLink } from '../types';
import { validateSocialUrl, validatePurchaseUrl, formatUrl } from '../utils/validation';
import { getPurchaseLinks } from '../utils/purchaseLinks';
import { calculateDiscount } from '../utils/discount';
import AdminLaunchMode from './AdminLaunchMode';
import { LaunchSettings } from '../firebase/firestore';
import { AdminFormSkeleton } from './Skeletons';
import { slugify, generateUniqueSlug, getDomain, calculateProductSEOScore } from '../lib/seo';
import { fetchSearchAnalyticsData } from '../lib/searchEngine';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  reels: Reel[];
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
  launchSettings: LaunchSettings;
  onSaveLaunchSettings: (settings: LaunchSettings) => Promise<void>;
}

export default function AdminPanel({
  products,
  categories,
  reels,
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
  launchSettings,
  onSaveLaunchSettings,
  isLoading = false,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'reels' | 'launch' | 'search'>('dashboard');
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

  const [reelFormOpen, setReelFormOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<Reel | null>(null);

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
          <p className="text-xs text-neutral-400 mt-0.5">Manage curated links, vertical video reels, and track affiliate metrics.</p>
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
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 text-xs font-bold pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reels'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          Reel Manager ({reels.length})
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
                            src={p.images[0]}
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
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{c.name}</h4>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ID: {c.id} | Icon: {c.icon}</p>
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

        {/* Reels Tab */}
        {activeTab === 'reels' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Curated Vertical Reels</h3>
              <button
                onClick={() => {
                  setEditingReel(null);
                  setReelFormOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Video Reel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reels.map(r => (
                <div key={r.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="relative aspect-[9/16] bg-neutral-950 overflow-hidden group">
                    <img
                      src={r.thumbnailUrl}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                      <span className="text-[8px] bg-red-500 text-white font-bold uppercase px-1.5 py-0.5 rounded self-start mb-1.5">
                        {r.platform}
                      </span>
                      <p className="text-[11px] font-bold text-white line-clamp-2">{r.title}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950/50 border-t border-neutral-850 flex justify-between items-center mt-auto">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold block">Linked Product</span>
                      <span className="text-[11px] text-emerald-400 font-semibold truncate max-w-[120px] block">
                        {products.find(p => p.id === r.productId)?.title || 'No product linked'}
                      </span>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingReel(r);
                          setReelFormOpen(true);
                        }}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteReel(r.id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* MODAL: REEL FORM */}
      <AnimatePresence>
        {reelFormOpen && (
          <ReelFormModal
            reel={editingReel}
            products={products}
            categories={categories}
            onClose={() => setReelFormOpen(false)}
            onSave={(r) => {
              if (editingReel) {
                onUpdateReel(r);
              } else {
                onAddReel(r);
              }
              setReelFormOpen(false);
            }}
            imagePresets={imagePresets}
          />
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
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || '');
  // Purchase Links state initialization
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>(() => {
    const loaded = getPurchaseLinks(product);
    if (loaded.length > 0) return loaded;
    return [{ name: 'Amazon', url: '' }];
  });
  const [purchaseLinkErrors, setPurchaseLinkErrors] = useState<{ [index: number]: string }>({});

  const handleAddPurchaseLink = () => {
    setPurchaseLinks(prev => [...prev, { name: '', url: '' }]);
  };

  const handleRemovePurchaseLink = (index: number) => {
    setPurchaseLinks(prev => prev.filter((_, i) => i !== index));
    setPurchaseLinkErrors(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handlePurchaseLinkChange = (index: number, field: 'name' | 'url', value: string) => {
    setPurchaseLinks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    if (field === 'url') {
      const valResult = validatePurchaseUrl(value);
      setPurchaseLinkErrors(prev => ({
        ...prev,
        [index]: value.trim() ? (valResult.isValid ? '' : valResult.errorMessage || 'Invalid URL') : ''
      }));
    }
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
  const [seenInReel, setSeenInReel] = useState(product?.badges.seenInReel || false);
  const [personallyTested, setPersonallyTested] = useState(product?.badges.personallyTested || true);
  const [recommended, setRecommended] = useState(product?.badges.recommended || true);
  const [trending, setTrending] = useState(product?.badges.trending || false);

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

  const seoAudit = calculateProductSEOScore({
    title,
    description,
    seoTitle,
    seoDescription,
    seoSlug: effectiveSlug,
    searchTags,
    images: imageUrl ? [imageUrl] : [],
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
    if (!title || !description || !imageUrl) return;

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

    // Validate Purchase Links
    let hasPurchaseLinkError = false;
    const newLinkErrors: { [index: number]: string } = {};
    const validPurchaseLinks: PurchaseLink[] = [];

    purchaseLinks.forEach((link, idx) => {
      const trimmedName = link.name.trim();
      const trimmedUrl = link.url.trim();

      if (trimmedName || trimmedUrl) {
        if (!trimmedName) {
          newLinkErrors[idx] = 'Platform Name is required.';
          hasPurchaseLinkError = true;
        }
        const valResult = validatePurchaseUrl(trimmedUrl);
        if (!valResult.isValid) {
          newLinkErrors[idx] = valResult.errorMessage || 'Invalid URL format.';
          hasPurchaseLinkError = true;
        } else {
          validPurchaseLinks.push({
            name: trimmedName,
            url: formatUrl(trimmedUrl)
          });
        }
      }
    });

    if (hasPurchaseLinkError) {
      setPurchaseLinkErrors(newLinkErrors);
      return;
    }
    setPurchaseLinkErrors({});

    const discountPercentage = calculateDiscount(Number(originalPrice), Number(price)).percentage;

    // Backward compatibility: build affiliateLinks array from purchaseLinks
    const affiliateLinks: Product['affiliateLinks'] = validPurchaseLinks.map(l => ({
      platform: l.name,
      url: l.url
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
      price: Number(price),
      originalPrice: Number(originalPrice),
      discount: discountPercentage,
      description,
      whyIRecommend,
      brand,
      category,
      rating: parsedRating,
      images: [imageUrl],
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
        photos: [imageUrl]
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

          {/* Image & Preset selection */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-neutral-800 pb-1">Media Assets</h4>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 mb-1">Display Image URL *</label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Or Select High-Quality Presets:</span>
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {imagePresets.map((preset, i) => (
                  <img
                    key={i}
                    onClick={() => setImageUrl(preset)}
                    src={preset}
                    alt="Preset"
                    className={`w-12 h-12 object-cover rounded-xl cursor-pointer border-2 transition-all ${
                      imageUrl === preset ? 'border-emerald-500 scale-95' : 'border-transparent hover:border-neutral-700'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Purchase Links & Badges */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div>
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Purchase Links
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Add custom purchase links for various platforms (Amazon, Flipkart, Meesho, Myntra, Croma, etc.)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPurchaseLink}
                className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Platform</span>
              </button>
            </div>

            <div className="space-y-3">
              {purchaseLinks.map((link, idx) => (
                <div key={idx} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-850 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1/3 min-w-[130px]">
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        list="popular-platforms-list"
                        value={link.name}
                        onChange={e => handlePurchaseLinkChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Amazon, Flipkart"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                        Platform URL
                      </label>
                      <input
                        type="url"
                        value={link.url}
                        onChange={e => handlePurchaseLinkChange(idx, 'url', e.target.value)}
                        placeholder="https://..."
                        className={`w-full bg-neutral-900 border ${
                          purchaseLinkErrors[idx] ? 'border-red-500 focus:border-red-400' : 'border-neutral-800 focus:border-emerald-500'
                        } rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors`}
                      />
                    </div>

                    <div className="pt-5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemovePurchaseLink(idx)}
                        disabled={purchaseLinks.length === 1 && idx === 0 && !link.name && !link.url}
                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete purchase link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {purchaseLinkErrors[idx] && (
                    <p className="text-[10px] text-red-400 font-semibold pl-1">
                      {purchaseLinkErrors[idx]}
                    </p>
                  )}
                </div>
              ))}

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
            <select
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="Layout">Layout</option>
              <option value="Cpu">Cpu</option>
              <option value="Gamepad2">Gamepad2</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Laptop">Laptop</option>
              <option value="Home">Home</option>
              <option value="Utensils">Utensils</option>
              <option value="BookOpen">BookOpen</option>
              <option value="Car">Car</option>
              <option value="Sparkles">Sparkles</option>
            </select>
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
