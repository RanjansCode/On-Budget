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
  TrendingUp, MousePointer, Share2, DollarSign, Upload, Info, Check, Eye, HelpCircle, Save, X
} from 'lucide-react';
import { Product, Category, Reel, AnalyticsData } from '../types';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  reels: Reel[];
  analytics: AnalyticsData;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddReel: (reel: Reel) => void;
  onUpdateReel: (reel: Reel) => void;
  onDeleteReel: (reelId: string) => void;
}

const DEFAULT_PIN = '1234';

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
}: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'reels'>('dashboard');

  // Modal / Form States
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [reelFormOpen, setReelFormOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<Reel | null>(null);

  // Authentication handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === DEFAULT_PIN) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid security PIN. Please try again.');
      setPinInput('');
    }
  };

  // Image Presets for premium catalog creation
  const imagePresets = [
    'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80'
  ];

  // Helper mock chart data
  const chartData = analytics.clicksHistory;

  const platformChartData = analytics.affiliateClicks.map(p => ({
    name: p.platform,
    clicks: p.clicks
  }));

  // Render Lock Screen if not authorized
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-xl text-center">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">On Budget Admin Panel</h2>
        <p className="text-xs text-neutral-400 mt-2 mb-6">
          Authorized personnel only. Please input the master security credentials.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Enter Admin Security PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center tracking-widest text-lg font-bold bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {pinError && <p className="text-red-400 text-[11px] mt-2 font-medium">{pinError}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold py-3 rounded-xl cursor-pointer transition-colors"
          >
            Authenticate Core
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-neutral-850 text-left">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-500" /> Quick testing guideline:
          </span>
          <p className="text-[11px] text-neutral-400 mt-1">
            Use PIN <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono font-bold">1234</code> to log in and unlock full dashboard features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Navbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-white">On Budget HQ</h2>
            <span className="text-[9px] font-bold tracking-wide bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
              Admin Session
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Manage curated links, vertical video reels, and track affiliate metrics.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            Lock Terminal
          </button>
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
      </div>

      {/* Content Render */}
      <div>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-neutral-400" /> Total Visitors
                </span>
                <span className="text-2xl font-black text-white mt-2">{analytics.totalVisitors.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">Live simulation tracker</span>
              </div>

              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-neutral-400" /> Total Link Clicks
                </span>
                <span className="text-2xl font-black text-white mt-2">{analytics.pageViews.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">CTR: {(analytics.pageViews / analytics.totalVisitors * 100).toFixed(1)}%</span>
              </div>

              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-neutral-400" /> Affiliate Clicks
                </span>
                <span className="text-2xl font-black text-white mt-2">
                  {analytics.affiliateClicks.reduce((sum, curr) => sum + curr.clicks, 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1">Conversion: {analytics.bounceRate}% (Simulated)</span>
              </div>

              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-neutral-400" /> Top Platform
                </span>
                <span className="text-2xl font-black text-white mt-2">Amazon</span>
                <span className="text-[10px] text-neutral-400 mt-1">72% of traffic destination</span>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
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
                      <XAxis dataKey="date" stroke="#525252" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#525252" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff' }} />
                      <Area type="monotone" dataKey="clicks" stroke="#10b981" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider"> clicks by affiliate platform</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformChartData}>
                      <XAxis dataKey="name" stroke="#525252" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#525252" style={{ fontSize: '10px' }} />
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
              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-4">Top Performing Products</h3>
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
                        <p className="text-[9px] text-neutral-500 font-medium">Conversion: 14%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic details */}
              <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-4">Traffic Demographics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Devices</h4>
                    <div className="space-y-2">
                      {analytics.devices.map(d => (
                        <div key={d.device} className="flex justify-between items-center text-xs text-neutral-300">
                          <span>{d.device}</span>
                          <span className="font-bold">{d.count} ({Math.round(d.count / (analytics.devices.reduce((acc, curr) => acc + curr.count, 0) || 1) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Countries</h4>
                    <div className="space-y-2">
                      {analytics.countries.map(c => (
                        <div key={c.country} className="flex justify-between items-center text-xs text-neutral-300">
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
      </div>

      {/* MODAL: PRODUCT FORM */}
      <AnimatePresence>
        {productFormOpen && (
          <ProductFormModal
            product={editingProduct}
            categories={categories}
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
  onClose: () => void;
  onSave: (product: Product) => void;
  imagePresets: string[];
}

function ProductFormModal({ product, categories, onClose, onSave, imagePresets }: ProductFormModalProps) {
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
  const [amazonUrl, setAmazonUrl] = useState(product?.affiliateLinks.find(l => l.platform === 'Amazon')?.url || '');
  const [meeshoUrl, setMeeshoUrl] = useState(product?.affiliateLinks.find(l => l.platform === 'Meesho')?.url || '');

  // Badges
  const [seenInReel, setSeenInReel] = useState(product?.badges.seenInReel || false);
  const [personallyTested, setPersonallyTested] = useState(product?.badges.personallyTested || true);
  const [recommended, setRecommended] = useState(product?.badges.recommended || true);
  const [trending, setTrending] = useState(product?.badges.trending || false);

  // Review
  const [reviewRating, setReviewRating] = useState(product?.creatorReview.rating || 5);
  const [reviewText, setReviewText] = useState(product?.creatorReview.reviewText || '');
  const [unboxingText, setUnboxingText] = useState(product?.creatorReview.unboxingText || '');
  const [setupGuideText, setSetupGuideText] = useState(product?.creatorReview.setupGuideText || '');
  const [myExperience, setMyExperience] = useState(product?.creatorReview.myExperience || '');
  const [myVerdict, setMyVerdict] = useState(product?.creatorReview.myVerdict || '');

  // Lists
  const [prosText, setProsText] = useState(product?.pros.join('\n') || '');
  const [consText, setConsText] = useState(product?.cons.join('\n') || '');
  const [specText, setSpecText] = useState(product?.specifications.map(s => `${s.name}: ${s.value}`).join('\n') || 'Material: Plastic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !imageUrl) return;

    const discountPercentage = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const affiliateLinks: Product['affiliateLinks'] = [];
    if (amazonUrl) affiliateLinks.push({ platform: 'Amazon', url: amazonUrl });
    if (meeshoUrl) affiliateLinks.push({ platform: 'Meesho', url: meeshoUrl });

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
      rating: Number(rating),
      images: [imageUrl],
      videos: ['https://assets.mixkit.co/videos/preview/mixkit-working-with-various-tools-and-devices-on-desk-43301-large.mp4'],
      affiliateLinks,
      badges: {
        seenInReel,
        personallyTested,
        recommended,
        trending
      },
      creatorReview: {
        rating: Number(reviewRating),
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

          {/* Section 2: Affiliate & Badging */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-neutral-800 pb-1">Affiliate Links & Badges</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Amazon Link</label>
                <input
                  type="url"
                  value={amazonUrl}
                  onChange={e => setAmazonUrl(e.target.value)}
                  placeholder="https://amazon.in/dp/..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Meesho Link</label>
                <input
                  type="url"
                  value={meeshoUrl}
                  onChange={e => setMeeshoUrl(e.target.value)}
                  placeholder="https://meesho.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <span className="block text-[11px] font-bold text-neutral-400 mb-2">Configure Badges</span>
                <div className="grid grid-cols-4 gap-2.5">
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
                  min={1}
                  max={5}
                  value={reviewRating}
                  onChange={e => setReviewRating(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
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
