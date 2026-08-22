/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Star,
  DollarSign,
  Sparkles,
  TrendingUp,
  Heart,
  Tag,
  ShoppingBag,
  Video,
  FlaskConical,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Layers,
  LayoutGrid,
  Settings2,
  Sliders,
  CheckCircle2,
  FileText,
  Archive,
  Zap,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  Product,
  Category,
  HomepageSectionConfig,
  HomepageSectionVisibility,
  DEFAULT_HOMEPAGE_SECTIONS_CONFIG,
  SectionDisplayStyle,
  SectionSorting,
  SectionType
} from '../types';
import { renderSectionIcon, POPULAR_SECTION_ICONS } from '../utils/iconMap';
import { getProductsForSection } from '../utils/sectionFilterEngine';
import { migrateLegacySectionsToConfig } from '../firebase/firestore';
import ProductCard from './ProductCard';

interface AdminHomepageSectionsProps {
  sectionVisibility?: HomepageSectionVisibility | HomepageSectionConfig[];
  onSaveSectionVisibility: (settings: HomepageSectionConfig[] | any) => Promise<void>;
  products?: Product[];
  categories?: Category[];
  isLoading?: boolean;
}

// Built-in ready-to-use template definitions for 1-click creation
const SECTION_TEMPLATES: Array<Omit<HomepageSectionConfig, 'id' | 'order' | 'createdAt' | 'updatedAt'>> = [
  {
    title: '🔥 Trending Tech Under ₹499',
    description: 'Hot viral gadgets with high user engagement & budget pricing',
    icon: '🔥',
    badge: 'HOT',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 10,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      maxPrice: 499,
      trending: true,
    },
    sorting: 'trending',
  },
  {
    title: '💰 Ultra Budget Steals Under ₹199',
    description: 'Pocket-friendly everyday accessories & cables under ₹199',
    icon: '💰',
    badge: 'UNDER ₹199',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 12,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      maxPrice: 199,
    },
    sorting: 'price_asc',
  },
  {
    title: '🏷️ Massive 50%+ Price Cuts',
    description: 'Deals with the steepest percentage discounts available right now',
    icon: '🏷️',
    badge: '50%+ OFF',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 8,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      minDiscount: 50,
    },
    sorting: 'discount_desc',
  },
  {
    title: '⭐ Verified 4.5+ Star Top Picks',
    description: 'Customer approved favorites with top tier review ratings',
    icon: '⭐',
    badge: '4.5★ RATED',
    type: 'grid_3',
    productSource: 'auto',
    displayStyle: 'grid_3',
    maxProducts: 6,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      minRating: 4.5,
    },
    sorting: 'rating_desc',
  },
  {
    title: '🧪 Creator Tested & Approved',
    description: 'Personally unboxed, quality checked & validated by Ranjan',
    icon: '🧪',
    badge: '100% TESTED',
    type: 'featured_large',
    productSource: 'auto',
    displayStyle: 'featured_large',
    maxProducts: 5,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      personallyTested: true,
    },
    sorting: 'newest',
  },
  {
    title: '🎥 As Seen on Instagram Reels',
    description: 'Viral gadgets featured in unboxing videos & reel breakdowns',
    icon: '🎥',
    badge: 'VIRAL',
    type: 'carousel',
    productSource: 'auto',
    displayStyle: 'carousel',
    maxProducts: 8,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      featuredInVideo: true,
    },
    sorting: 'trending',
  },
  {
    title: '📱 Mobile & Smartphone Essentials',
    description: 'Phone holders, chargers, fast cables & portable docks',
    icon: '📱',
    badge: 'MOBILE',
    type: 'grid_4',
    productSource: 'auto',
    displayStyle: 'grid_4',
    maxProducts: 8,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      categoryNames: ['Mobile Accessories', 'Smartphones', 'Electronics'],
    },
    sorting: 'trending',
  },
  {
    title: '🎮 Desk Setup & Gaming Vibes',
    description: 'RGB lighting, desk mats, audio gear and cable organizers',
    icon: '🎮',
    badge: 'DESK SETUP',
    type: 'grid_3',
    productSource: 'auto',
    displayStyle: 'grid_3',
    maxProducts: 6,
    status: 'published',
    visible: true,
    isBuiltIn: false,
    filters: {
      conditionLogic: 'AND',
      categoryNames: ['Gaming', 'Desk Setup', 'Accessories'],
    },
    sorting: 'trending',
  },
];

export default function AdminHomepageSections({
  sectionVisibility,
  onSaveSectionVisibility,
  products = [],
  categories = [],
  isLoading = false,
}: AdminHomepageSectionsProps) {
  // Normalize state to HomepageSectionConfig[]
  const [sections, setSections] = useState<HomepageSectionConfig[]>(() => {
    return migrateLegacySectionsToConfig(sectionVisibility || DEFAULT_HOMEPAGE_SECTIONS_CONFIG);
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'visible' | 'hidden' | 'draft' | 'builtin' | 'custom' | 'archived'>('all');

  // Modals
  const [showDisableAllModal, setShowDisableAllModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSectionConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewingSection, setPreviewingSection] = useState<HomepageSectionConfig | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Active form tab inside the Create/Edit modal
  const [formTab, setFormTab] = useState<'basic' | 'layout' | 'rules'>('basic');

  // Manual Product search inside Edit modal
  const [manualProductSearch, setManualProductSearch] = useState('');

  // Sync state if prop changes from background Firestore listener
  useEffect(() => {
    if (sectionVisibility) {
      const migrated = migrateLegacySectionsToConfig(sectionVisibility);
      setSections(migrated);
    }
  }, [sectionVisibility]);

  // Counts for summary metrics
  const activeSections = sections.filter(s => s.status !== 'archived');
  const visibleCount = activeSections.filter(s => s.visible && s.status === 'published').length;
  const hiddenCount = activeSections.filter(s => !s.visible || s.status === 'hidden').length;
  const draftCount = activeSections.filter(s => s.status === 'draft').length;
  const builtInCount = activeSections.filter(s => s.isBuiltIn).length;
  const customCount = activeSections.filter(s => !s.isBuiltIn).length;
  const archivedCount = sections.filter(s => s.status === 'archived').length;

  // Filtered sections for the list view
  const filteredSections = useMemo(() => {
    return sections
      .filter(sec => {
        // Tab filter
        if (activeTabFilter === 'visible' && (sec.status !== 'published' || !sec.visible)) return false;
        if (activeTabFilter === 'hidden' && (sec.status !== 'hidden' && sec.visible)) return false;
        if (activeTabFilter === 'draft' && sec.status !== 'draft') return false;
        if (activeTabFilter === 'builtin' && (!sec.isBuiltIn || sec.status === 'archived')) return false;
        if (activeTabFilter === 'custom' && (sec.isBuiltIn || sec.status === 'archived')) return false;
        if (activeTabFilter === 'archived' && sec.status !== 'archived') return false;
        if (activeTabFilter !== 'archived' && sec.status === 'archived') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = sec.title.toLowerCase().includes(q);
          const matchDesc = (sec.description || '').toLowerCase().includes(q);
          const matchBadge = (sec.badge || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchBadge) return false;
        }

        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections, activeTabFilter, searchQuery]);

  // Persist helper
  const persistChanges = async (newSections: HomepageSectionConfig[]) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSaveSectionVisibility(newSections);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error('Failed to save homepage sections:', err);
      setErrorMessage(err?.message || 'Failed to save homepage sections to cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Visibility Toggle
  const handleQuickToggle = async (sectionId: string) => {
    const updated = sections.map(sec => {
      if (sec.id === sectionId) {
        const nextVisible = !sec.visible;
        return {
          ...sec,
          visible: nextVisible,
          status: nextVisible ? 'published' : 'hidden',
          updatedAt: new Date().toISOString(),
        } as HomepageSectionConfig;
      }
      return sec;
    });
    setSections(updated);
    await persistChanges(updated);
  };

  // Move Section Up in Order
  const handleMoveOrder = async (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    // Re-index orders
    const reindexed = newSections.map((sec, idx) => ({
      ...sec,
      order: idx + 1,
      updatedAt: new Date().toISOString(),
    }));

    setSections(reindexed);
    await persistChanges(reindexed);
  };

  // Bulk Enable All
  const handleEnableAll = async () => {
    const updated: HomepageSectionConfig[] = sections.map(s => ({
      ...s,
      visible: true,
      status: (s.status === 'archived' ? 'archived' : 'published') as SectionStatus,
      updatedAt: new Date().toISOString(),
    }));
    setSections(updated);
    await persistChanges(updated);
  };

  // Bulk Disable All
  const handleDisableAllConfirm = async () => {
    const updated: HomepageSectionConfig[] = sections.map(s => ({
      ...s,
      visible: false,
      status: (s.status === 'archived' ? 'archived' : 'hidden') as SectionStatus,
      updatedAt: new Date().toISOString(),
    }));
    setSections(updated);
    setShowDisableAllModal(false);
    await persistChanges(updated);
  };

  // Duplicate Section
  const handleDuplicate = async (sec: HomepageSectionConfig) => {
    const newSection: HomepageSectionConfig = {
      ...sec,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${sec.title} (Copy)`,
      isBuiltIn: false,
      builtInKey: undefined,
      order: sections.length + 1,
      status: 'draft',
      visible: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...sections, newSection];
    setSections(updated);
    await persistChanges(updated);
  };

  // Archive or Unarchive
  const handleToggleArchive = async (sec: HomepageSectionConfig) => {
    const nextStatus = sec.status === 'archived' ? 'hidden' : 'archived';
    const updated = sections.map(s => {
      if (s.id === sec.id) {
        return {
          ...s,
          status: nextStatus,
          visible: nextStatus === 'archived' ? false : s.visible,
          updatedAt: new Date().toISOString(),
        } as HomepageSectionConfig;
      }
      return s;
    });
    setSections(updated);
    await persistChanges(updated);
  };

  // Permanent Delete (Archived custom sections only)
  const handleDeletePermanent = async (sectionId: string) => {
    const updated = sections.filter(s => s.id !== sectionId);
    setSections(updated);
    setDeleteConfirmId(null);
    await persistChanges(updated);
  };

  // Open "Create New Section" Form
  const handleOpenCreateModal = () => {
    const newSection: HomepageSectionConfig = {
      id: `custom_${Date.now()}`,
      title: '',
      description: '',
      icon: '🔥',
      badge: '',
      type: 'carousel',
      productSource: 'auto',
      displayStyle: 'carousel',
      maxProducts: 8,
      status: 'published',
      visible: true,
      isBuiltIn: false,
      order: sections.length + 1,
      filters: {
        conditionLogic: 'AND',
      },
      sorting: 'trending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingSection(newSection);
    setIsCreatingNew(true);
    setFormTab('basic');
  };

  // Create from Template
  const handleApplyTemplate = async (template: Omit<HomepageSectionConfig, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => {
    const newSection: HomepageSectionConfig = {
      ...template,
      id: `custom_${Date.now()}`,
      order: sections.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setShowTemplatesModal(false);
    await persistChanges(updated);
  };

  // Save Modal Form Changes
  const handleSaveModalForm = async (targetStatus?: 'published' | 'draft' | 'hidden') => {
    if (!editingSection || !editingSection.title.trim()) {
      alert('Please provide a section title.');
      return;
    }

    const finalStatus = targetStatus || editingSection.status;
    const finalSection: HomepageSectionConfig = {
      ...editingSection,
      status: finalStatus,
      visible: finalStatus === 'published',
      updatedAt: new Date().toISOString(),
    };

    let updated: HomepageSectionConfig[];
    if (isCreatingNew) {
      updated = [...sections, finalSection];
    } else {
      updated = sections.map(s => s.id === finalSection.id ? finalSection : s);
    }

    setSections(updated);
    setEditingSection(null);
    setIsCreatingNew(false);
    await persistChanges(updated);
  };

  // Live Matched Products in Editor Modal
  const modalMatchedProducts = useMemo(() => {
    if (!editingSection) return [];
    return getProductsForSection(products, editingSection);
  }, [editingSection, products]);

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Banner & Action Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FF5A00]/10 text-[#FF5A00] flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-display tracking-tight">
                Homepage Section Builder
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-sans">
              Create unlimited custom homepage sections, filter products automatically by price/category/rating, reorder sections on the fly, and toggle live display styles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="admin-add-section-btn"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5A00] hover:bg-[#E04F00] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Section</span>
            </button>

            <button
              id="admin-quick-templates-btn"
              onClick={() => setShowTemplatesModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Quick Templates</span>
            </button>

            <button
              id="admin-enable-all-sections-btn"
              onClick={handleEnableAll}
              disabled={isSaving}
              className="px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
              title="Turn ON all sections"
            >
              Enable All
            </button>

            <button
              id="admin-disable-all-sections-btn"
              onClick={() => setShowDisableAllModal(true)}
              disabled={isSaving}
              className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
              title="Turn OFF all sections"
            >
              Disable All
            </button>
          </div>
        </div>

        {/* 2. Quick Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/40 dark:border-slate-700/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sections</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{activeSections.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Visible Live</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{visibleCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Hidden</span>
            <span className="text-lg font-black text-slate-600 dark:text-slate-300">{hiddenCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Drafts</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">{draftCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Built-in (10)</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{builtInCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Custom Created</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400">{customCount}</span>
          </div>
        </div>

        {/* Feedback Alert Messages */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Homepage sections updated and synced with cloud database!</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Search & Tabs Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sections by name, badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All', count: activeSections.length },
            { key: 'visible', label: 'Visible', count: visibleCount },
            { key: 'hidden', label: 'Hidden', count: hiddenCount },
            { key: 'draft', label: 'Drafts', count: draftCount },
            { key: 'builtin', label: 'Built-in', count: builtInCount },
            { key: 'custom', label: 'Custom', count: customCount },
            { key: 'archived', label: 'Archived', count: archivedCount },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTabFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTabFilter === tab.key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label} <span className="opacity-60 text-[10px] ml-0.5">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Section List Table / Cards */}
      <div className="space-y-3">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No homepage sections match your filter.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTabFilter('all'); }}
              className="mt-3 text-xs text-[#FF5A00] font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredSections.map((sec, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === filteredSections.length - 1;
            const isArchived = sec.status === 'archived';

            return (
              <div
                key={sec.id}
                id={`admin-sec-item-${sec.id}`}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 ${
                  sec.visible && sec.status === 'published'
                    ? 'border-slate-200/80 dark:border-slate-800 shadow-xs'
                    : 'border-slate-200/40 dark:border-slate-800/40 opacity-75 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Reorder controls & Section info */}
                  <div className="flex items-center gap-3.5">
                    {/* Order up/down buttons */}
                    {!isArchived && (
                      <div className="flex flex-col items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button
                          onClick={() => handleMoveOrder(sec.id, 'up')}
                          disabled={isFirst}
                          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">
                          #{sec.order || idx + 1}
                        </span>
                        <button
                          onClick={() => handleMoveOrder(sec.id, 'down')}
                          disabled={isLast}
                          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="p-2.5 rounded-2xl bg-orange-500/10 text-[#FF5A00] flex items-center justify-center shrink-0 min-w-[38px] min-h-[38px]">
                      {renderSectionIcon(sec.icon)}
                    </div>

                    {/* Name & metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-display">
                          {sec.title}
                        </h4>

                        {/* Badges */}
                        {sec.badge && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {sec.badge}
                          </span>
                        )}

                        {sec.isBuiltIn ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Built-in
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            Custom
                          </span>
                        )}

                        {/* Status badge */}
                        {sec.status === 'published' && sec.visible && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            ● Live
                          </span>
                        )}
                        {sec.status === 'draft' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                        {sec.status === 'hidden' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 dark:text-slate-400">
                            Hidden
                          </span>
                        )}
                        {sec.status === 'archived' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            Archived
                          </span>
                        )}
                      </div>

                      {sec.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans line-clamp-1">
                          {sec.description}
                        </p>
                      )}

                      {/* Display Style & Rules summary */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 flex-wrap">
                        <span>
                          Layout: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{sec.displayStyle || 'carousel'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Max: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{sec.maxProducts || 10} items</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Source: <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                            {sec.productSource === 'manual' ? `Manual (${sec.manualProductIds?.length || 0})` : 'Auto Rules'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Toggle & Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Live Preview Button */}
                    <button
                      onClick={() => setPreviewingSection(sec)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      title="Live Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setEditingSection(sec);
                        setIsCreatingNew(false);
                        setFormTab('basic');
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#FF5A00] hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      title="Edit Section"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(sec)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      title="Duplicate Section"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Archive / Restore */}
                    {!sec.isBuiltIn && (
                      <button
                        onClick={() => handleToggleArchive(sec)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        title={isArchived ? "Restore Section" : "Archive Section"}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}

                    {/* Permanent Delete for archived custom section */}
                    {isArchived && !sec.isBuiltIn && (
                      <button
                        onClick={() => setDeleteConfirmId(sec.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-bold transition-all cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Visibility ON / OFF Switch */}
                    {!isArchived && (
                      <button
                        id={`toggle-sec-${sec.id}`}
                        onClick={() => handleQuickToggle(sec.id)}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-2 ${
                          sec.visible && sec.status === 'published' ? 'bg-[#FF5A00]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={sec.visible}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            sec.visible && sec.status === 'published' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. CREATE / EDIT SECTION MODAL */}
      <AnimatePresence>
        {editingSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#FF5A00]/10 text-[#FF5A00] flex items-center justify-center">
                    {renderSectionIcon(editingSection.icon)}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                      {isCreatingNew ? 'Create Homepage Section' : 'Edit Homepage Section'}
                    </h3>
                    <p className="text-xs text-slate-400">Configure visual layout, filtering criteria & product selection</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingSection(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 pt-2">
                {[
                  { id: 'basic', label: '1. Basic Info' },
                  { id: 'layout', label: '2. Layout & Display' },
                  { id: 'rules', label: '3. Product Source & Rules' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFormTab(t.id as any)}
                    className={`pb-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${
                      formTab === t.id
                        ? 'border-[#FF5A00] text-[#FF5A00]'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* TAB 1: BASIC INFO */}
                {formTab === 'basic' && (
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Section Name / Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 🔥 Trending Tech Under ₹499"
                        value={editingSection.title}
                        onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#FF5A00] focus:outline-none"
                      />
                    </div>

                    {/* Subtitle / Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Description / Subtitle <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. High-performance budget gadgets with great ratings"
                        value={editingSection.description || ''}
                        onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#FF5A00] focus:outline-none"
                      />
                    </div>

                    {/* Icon Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Section Icon
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {POPULAR_SECTION_ICONS.map(item => (
                          <button
                            type="button"
                            key={item.icon}
                            onClick={() => setEditingSection({ ...editingSection, icon: item.icon })}
                            className={`p-2 rounded-xl text-base transition-all cursor-pointer ${
                              editingSection.icon === item.icon
                                ? 'bg-[#FF5A00] text-white shadow-sm scale-110'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                            title={item.label}
                          >
                            {item.icon}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Custom emoji or icon name:</span>
                        <input
                          type="text"
                          value={editingSection.icon || ''}
                          onChange={(e) => setEditingSection({ ...editingSection, icon: e.target.value })}
                          placeholder="e.g. 🎯 or Sparkles or Smartphone"
                          className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-48"
                        />
                      </div>
                    </div>

                    {/* Optional Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Section Badge <span className="text-slate-400 font-normal">(Optional Tag)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. HOT, 50% OFF, TOP PICK"
                          value={editingSection.badge || ''}
                          onChange={(e) => setEditingSection({ ...editingSection, badge: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-[#FF5A00] focus:outline-none"
                        />
                      </div>

                      {/* Initial Status */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Publish Status
                        </label>
                        <select
                          value={editingSection.status}
                          onChange={(e) => setEditingSection({ ...editingSection, status: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer"
                        >
                          <option value="published">🚀 Published (Live on Homepage)</option>
                          <option value="draft">📝 Draft (Visible only in Admin)</option>
                          <option value="hidden">👁️‍🗨️ Hidden (Saved but turned OFF)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LAYOUT & DISPLAY */}
                {formTab === 'layout' && (
                  <div className="space-y-5">
                    {/* Display Style */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Display Layout Style
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { id: 'carousel', title: 'Horizontal Carousel', desc: 'Swipeable horizontal track with snap-scroll arrows' },
                          { id: 'grid_2', title: '2-Column Grid', desc: 'Generous 2-column cards layout' },
                          { id: 'grid_3', title: '3-Column Grid', desc: 'Balanced 3-column desktop presentation' },
                          { id: 'grid_4', title: '4-Column Grid', desc: 'Dense 4-column e-commerce grid' },
                          { id: 'featured_large', title: 'Featured Spotlight', desc: '1 Large hero product + companion cards' },
                        ].map(layout => (
                          <div
                            key={layout.id}
                            onClick={() => setEditingSection({ ...editingSection, displayStyle: layout.id as SectionDisplayStyle })}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                              editingSection.displayStyle === layout.id
                                ? 'border-[#FF5A00] bg-orange-500/5 dark:bg-orange-500/10'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <h5 className="font-bold text-slate-900 dark:text-white text-xs">{layout.title}</h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{layout.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Maximum Products */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Maximum Products to Show
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[4, 6, 8, 10, 12, 16, 20].map(count => (
                          <button
                            type="button"
                            key={count}
                            onClick={() => setEditingSection({ ...editingSection, maxProducts: count })}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                              editingSection.maxProducts === count
                                ? 'bg-[#FF5A00] text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Order Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Position Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={editingSection.order || 1}
                        onChange={(e) => setEditingSection({ ...editingSection, order: parseInt(e.target.value) || 1 })}
                        className="w-28 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: PRODUCT SOURCE & RULES */}
                {formTab === 'rules' && (
                  <div className="space-y-6">
                    {/* Source Switch */}
                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 max-w-md">
                      <button
                        type="button"
                        onClick={() => setEditingSection({ ...editingSection, productSource: 'auto' })}
                        className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                          editingSection.productSource === 'auto'
                            ? 'bg-white dark:bg-slate-900 text-[#FF5A00] shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        ⚡ Automatic Rules
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSection({ ...editingSection, productSource: 'manual' })}
                        className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                          editingSection.productSource === 'manual'
                            ? 'bg-white dark:bg-slate-900 text-[#FF5A00] shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        🎯 Manual Selection
                      </button>
                    </div>

                    {/* AUTOMATIC RULES CONTROLS */}
                    {editingSection.productSource === 'auto' ? (
                      <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        {/* Condition Logic */}
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Rule Match Logic:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSection({
                                ...editingSection,
                                filters: { ...editingSection.filters, conditionLogic: 'AND' }
                              })}
                              className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                                (editingSection.filters?.conditionLogic || 'AND') === 'AND'
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                  : 'text-slate-500'
                              }`}
                            >
                              ALL Conditions (AND)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSection({
                                ...editingSection,
                                filters: { ...editingSection.filters, conditionLogic: 'OR' }
                              })}
                              className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                                editingSection.filters?.conditionLogic === 'OR'
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                  : 'text-slate-500'
                              }`}
                            >
                              ANY Condition (OR)
                            </button>
                          </div>
                        </div>

                        {/* Filter Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Category */}
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Category Filter
                            </label>
                            <select
                              value={editingSection.filters?.categoryNames?.[0] || ''}
                              onChange={(e) => setEditingSection({
                                ...editingSection,
                                filters: {
                                  ...editingSection.filters,
                                  categoryNames: e.target.value ? [e.target.value] : undefined
                                }
                              })}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            >
                              <option value="">All Categories</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Max Price */}
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Max Price Limit (₹)
                            </label>
                            <div className="flex items-center gap-1.5">
                              {[199, 299, 499, 999].map(p => (
                                <button
                                  type="button"
                                  key={p}
                                  onClick={() => setEditingSection({
                                    ...editingSection,
                                    filters: { ...editingSection.filters, maxPrice: p }
                                  })}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                                    editingSection.filters?.maxPrice === p
                                      ? 'bg-[#FF5A00] text-white'
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  ₹{p}
                                </button>
                              ))}
                              <input
                                type="number"
                                placeholder="Custom"
                                value={editingSection.filters?.maxPrice || ''}
                                onChange={(e) => setEditingSection({
                                  ...editingSection,
                                  filters: {
                                    ...editingSection.filters,
                                    maxPrice: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                })}
                                className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                              />
                            </div>
                          </div>

                          {/* Min Discount */}
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Min Discount %
                            </label>
                            <select
                              value={editingSection.filters?.minDiscount || 0}
                              onChange={(e) => setEditingSection({
                                ...editingSection,
                                filters: {
                                  ...editingSection.filters,
                                  minDiscount: e.target.value ? parseInt(e.target.value) : undefined
                                }
                              })}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            >
                              <option value="0">Any Discount</option>
                              <option value="20">20%+ Off</option>
                              <option value="30">30%+ Off</option>
                              <option value="50">50%+ Off</option>
                              <option value="70">70%+ Off</option>
                            </select>
                          </div>

                          {/* Min Rating */}
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Min Star Rating
                            </label>
                            <select
                              value={editingSection.filters?.minRating || 0}
                              onChange={(e) => setEditingSection({
                                ...editingSection,
                                filters: {
                                  ...editingSection.filters,
                                  minRating: e.target.value ? parseFloat(e.target.value) : undefined
                                }
                              })}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            >
                              <option value="0">Any Rating</option>
                              <option value="3.5">3.5★ and above</option>
                              <option value="4.0">4.0★ and above</option>
                              <option value="4.5">4.5★ and above</option>
                            </select>
                          </div>
                        </div>

                        {/* Special Feature Toggles */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Special Filters</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingSection.filters?.personallyTested}
                                onChange={(e) => setEditingSection({
                                  ...editingSection,
                                  filters: { ...editingSection.filters, personallyTested: e.target.checked }
                                })}
                                className="accent-[#FF5A00]"
                              />
                              <span className="text-[11px] font-semibold">🧪 Tested Only</span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingSection.filters?.featuredInVideo}
                                onChange={(e) => setEditingSection({
                                  ...editingSection,
                                  filters: { ...editingSection.filters, featuredInVideo: e.target.checked }
                                })}
                                className="accent-[#FF5A00]"
                              />
                              <span className="text-[11px] font-semibold">🎥 Video Featured</span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingSection.filters?.trending}
                                onChange={(e) => setEditingSection({
                                  ...editingSection,
                                  filters: { ...editingSection.filters, trending: e.target.checked }
                                })}
                                className="accent-[#FF5A00]"
                              />
                              <span className="text-[11px] font-semibold">🔥 Trending Only</span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!editingSection.filters?.newlyAdded}
                                onChange={(e) => setEditingSection({
                                  ...editingSection,
                                  filters: { ...editingSection.filters, newlyAdded: e.target.checked }
                                })}
                                className="accent-[#FF5A00]"
                              />
                              <span className="text-[11px] font-semibold">🆕 New Arrivals</span>
                            </label>
                          </div>
                        </div>

                        {/* Sorting Strategy */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Product Sorting Strategy
                          </label>
                          <select
                            value={editingSection.sorting || 'trending'}
                            onChange={(e) => setEditingSection({ ...editingSection, sorting: e.target.value as SectionSorting })}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                          >
                            <option value="trending">🔥 Trending Score</option>
                            <option value="newest">🆕 Newest Added First</option>
                            <option value="price_asc">💰 Price: Low to High</option>
                            <option value="price_desc">💎 Price: High to Low</option>
                            <option value="discount_desc">🏷️ Highest Discount %</option>
                            <option value="rating_desc">⭐ Highest Star Rating</option>
                            <option value="most_wishlisted">❤️ Most Wishlisted</option>
                            <option value="most_purchased">🛒 Most Purchased / Converted</option>
                            <option value="random">🎲 Random Shuffle</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      /* MANUAL PRODUCT SELECTION CONTROLS */
                      <div className="space-y-4">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Selected Products ({editingSection.manualProductIds?.length || 0})
                            </span>
                            {editingSection.manualProductIds && editingSection.manualProductIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setEditingSection({ ...editingSection, manualProductIds: [] })}
                                className="text-[11px] text-rose-500 font-bold hover:underline cursor-pointer"
                              >
                                Clear Selection
                              </button>
                            )}
                          </div>

                          {/* Selected Products Chips */}
                          <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                            {(!editingSection.manualProductIds || editingSection.manualProductIds.length === 0) ? (
                              <span className="text-slate-400 italic text-[11px]">No products chosen yet. Search and click (+) below.</span>
                            ) : (
                              editingSection.manualProductIds.map((pid, pidx) => {
                                const prod = products.find(p => p.id === pid);
                                return (
                                  <div
                                    key={pid}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs"
                                  >
                                    <span className="text-[10px] text-slate-400 font-bold">#{pidx + 1}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                      {prod?.title || pid}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextIds = editingSection.manualProductIds?.filter(id => id !== pid);
                                        setEditingSection({ ...editingSection, manualProductIds: nextIds });
                                      }}
                                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Search Catalog to Add */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Search catalog to add products..."
                            value={manualProductSearch}
                            onChange={(e) => setManualProductSearch(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          />

                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {products
                              .filter(p => {
                                if (!manualProductSearch.trim()) return true;
                                return p.title.toLowerCase().includes(manualProductSearch.toLowerCase());
                              })
                              .slice(0, 15)
                              .map(p => {
                                const isSelected = editingSection.manualProductIds?.includes(p.id);
                                return (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <img src={p.images?.[0] || p.image || ''} alt={p.title} className="w-8 h-8 rounded-lg object-cover" />
                                      <div>
                                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{p.title}</div>
                                        <div className="text-[10px] text-slate-400">₹{p.price}</div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = editingSection.manualProductIds || [];
                                        const nextIds = isSelected ? current.filter(id => id !== p.id) : [...current, p.id];
                                        setEditingSection({ ...editingSection, manualProductIds: nextIds });
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-rose-500/10 text-rose-500'
                                          : 'bg-[#FF5A00] text-white hover:bg-[#E04F00]'
                                      }`}
                                    >
                                      {isSelected ? 'Remove' : '+ Add'}
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Matched Count Pill */}
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Matched: {modalMatchedProducts.length} items in current catalog
                      </span>
                      <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        {modalMatchedProducts.length > 0 ? 'Ready to display' : 'Empty'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewingSection(editingSection)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-300"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live Preview
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveModalForm('draft')}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/20 cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveModalForm('published')}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-[#FF5A00] text-white hover:bg-[#E04F00] font-bold text-xs shadow-sm cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : '🚀 Publish Section'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. QUICK TEMPLATES MODAL */}
      <AnimatePresence>
        {showTemplatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                      Ready-to-Use Section Templates
                    </h3>
                    <p className="text-xs text-slate-400">Choose a pre-configured section template to add in 1-click</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {SECTION_TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-[#FF5A00] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs">{tmpl.title}</h5>
                          {tmpl.badge && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              {tmpl.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{tmpl.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-3 py-1.5 rounded-xl bg-[#FF5A00] text-white hover:bg-[#E04F00] text-xs font-bold shrink-0 cursor-pointer"
                    >
                      + Add Template
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. LIVE PREVIEW MODAL */}
      <AnimatePresence>
        {previewingSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#FF5A00]" />
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                      Live Preview: {previewingSection.title}
                    </h3>
                    <p className="text-xs text-slate-400">Exact appearance as seen by visitors on the homepage</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewingSection(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {/* Header */}
                <div className="flex items-end justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#FF5A00]/10 text-[#FF5A00] flex items-center justify-center">
                        {renderSectionIcon(previewingSection.icon)}
                      </span>
                      <h4 className="text-base font-black text-slate-950 dark:text-white font-display">
                        {previewingSection.title}
                      </h4>
                      {previewingSection.badge && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {previewingSection.badge}
                        </span>
                      )}
                    </div>
                    {previewingSection.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{previewingSection.description}</p>
                    )}
                  </div>
                </div>

                {/* Products */}
                {(() => {
                  const prods = getProductsForSection(products, previewingSection);
                  if (prods.length === 0) {
                    return (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                        <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">0 products match the current section criteria.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex gap-4 overflow-x-auto scrollbar-none py-2">
                      {prods.map(p => (
                        <div key={p.id} className="shrink-0 w-[240px]">
                          <ProductCard
                            product={p}
                            onOpenProduct={() => {}}
                            isWishlisted={false}
                            onToggleWishlist={() => {}}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
                <button
                  onClick={() => setPreviewingSection(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. DISABLE ALL MODAL */}
      <AnimatePresence>
        {showDisableAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 w-fit">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Disable all homepage sections?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will turn OFF all recommendation sections on the live homepage. You can re-enable them at any time.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDisableAllModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisableAllConfirm}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer"
                >
                  Yes, Disable All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. PERMANENT DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 w-fit">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Delete Section Permanently?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This custom homepage section will be permanently deleted from the database. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePermanent(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
