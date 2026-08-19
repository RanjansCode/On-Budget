import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Power
} from 'lucide-react';
import { ProductVariant, ProductVariantOption, VariantStockStatus } from '../types';
import { generateVariantCombinations } from '../utils/variantUtils';
import { calculateDiscountPercent } from '../utils/retailerOffers';

interface ProductVariantAdminProps {
  hasVariants: boolean;
  onToggleHasVariants: (enabled: boolean) => void;
  variantOptions: ProductVariantOption[];
  onChangeVariantOptions: (options: ProductVariantOption[]) => void;
  variants: ProductVariant[];
  onChangeVariants: (variants: ProductVariant[]) => void;
  basePrice: number;
  baseOriginalPrice: number;
  baseImages: string[];
}

const COMMON_OPTION_PRESETS = [
  { name: 'Color', placeholder: 'e.g. Matte Black, Arctic White, Midnight Blue' },
  { name: 'Size', placeholder: 'e.g. S, M, L, XL or 6, 7, 8, 9, 10' },
  { name: 'Storage', placeholder: 'e.g. 64GB, 128GB, 256GB, 512GB' },
  { name: 'RAM', placeholder: 'e.g. 4GB, 8GB, 16GB' },
  { name: 'Pack Size', placeholder: 'e.g. Pack of 1, Pack of 2, Pack of 4' },
  { name: 'Material', placeholder: 'e.g. Aluminum, Leather, Silicone' },
  { name: 'Model', placeholder: 'e.g. Standard, Pro, Max' },
];

export const ProductVariantAdmin: React.FC<ProductVariantAdminProps> = ({
  hasVariants,
  onToggleHasVariants,
  variantOptions,
  onChangeVariantOptions,
  variants,
  onChangeVariants,
  basePrice,
  baseOriginalPrice,
  baseImages,
}) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [valueInputs, setValueInputs] = useState<{ [optionId: string]: string }>({});
  const [bulkPriceInput, setBulkPriceInput] = useState<string>('');
  const [bulkOriginalPriceInput, setBulkOriginalPriceInput] = useState<string>('');
  const [bulkStockStatus, setBulkStockStatus] = useState<VariantStockStatus>('in_stock');
  const [bulkAffiliateUrl, setBulkAffiliateUrl] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  // Add a new option dimension
  const handleAddOption = (nameToAdd?: string) => {
    const name = (nameToAdd || newOptionName).trim();
    if (!name) return;

    if (variantOptions.some(o => o.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    const newOption: ProductVariantOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      values: []
    };

    const updatedOptions = [...variantOptions, newOption];
    onChangeVariantOptions(updatedOptions);
    setNewOptionName('');
  };

  // Remove an option dimension
  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = variantOptions.filter(o => o.id !== optionId);
    onChangeVariantOptions(updatedOptions);

    const optName = variantOptions.find(o => o.id === optionId)?.name;
    if (optName) {
      const updatedVariants = variants.map(v => {
        const newOptions = { ...v.options };
        delete newOptions[optName];
        return { ...v, options: newOptions };
      });
      onChangeVariants(updatedVariants);
    }
  };

  // Add value to an option
  const handleAddValue = (optionId: string) => {
    const rawVal = valueInputs[optionId]?.trim();
    if (!rawVal) return;

    const parts = rawVal.split(',').map(s => s.trim()).filter(Boolean);

    const updatedOptions = variantOptions.map(opt => {
      if (opt.id !== optionId) return opt;
      const currentValues = [...opt.values];
      for (const p of parts) {
        if (!currentValues.includes(p)) {
          currentValues.push(p);
        }
      }
      return { ...opt, values: currentValues };
    });

    onChangeVariantOptions(updatedOptions);
    setValueInputs(prev => ({ ...prev, [optionId]: '' }));
  };

  // Remove value from option
  const handleRemoveValue = (optionId: string, valToRemove: string) => {
    const updatedOptions = variantOptions.map(opt => {
      if (opt.id !== optionId) return opt;
      return { ...opt, values: opt.values.filter(v => v !== valToRemove) };
    });
    onChangeVariantOptions(updatedOptions);
  };

  // Generate All Variant Combinations
  const handleGenerateMatrix = () => {
    const generated = generateVariantCombinations(
      variantOptions,
      variants
    );
    onChangeVariants(generated);
    setShowGenerateConfirm(false);
  };

  // Update specific variant field
  const handleUpdateVariantField = (
    variantId: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    const updated = variants.map(v => {
      if (v.id !== variantId) return v;
      const copy: any = { ...v, [field]: value };
      
      if (field === 'price' || field === 'originalPrice') {
        const p = Number(field === 'price' ? value : copy.price) || 0;
        const op = Number(field === 'originalPrice' ? value : copy.originalPrice) || 0;
        if (p > 0 && op > 0) {
          copy.discount = calculateDiscountPercent(op, p);
        }
      }
      return copy;
    });
    onChangeVariants(updated);
  };

  // Remove single variant row
  const handleRemoveVariant = (variantId: string) => {
    onChangeVariants(variants.filter(v => v.id !== variantId));
  };

  // Add custom manual variant row
  const handleAddManualVariant = () => {
    const initialSelections: Record<string, string> = {};
    variantOptions.forEach(opt => {
      if (opt.values.length > 0) {
        initialSelections[opt.name] = opt.values[0];
      }
    });

    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      options: initialSelections,
      price: basePrice || 0,
      originalPrice: baseOriginalPrice || basePrice || 0,
      discount: calculateDiscountPercent(baseOriginalPrice || basePrice || 0, basePrice || 0),
      stockStatus: 'in_stock',
      isActive: true,
      sku: `SKU-${Date.now().toString().slice(-4)}`
    };

    onChangeVariants([...variants, newVariant]);
  };

  // Bulk Apply Functions
  const handleApplyBulkPrice = () => {
    const p = parseFloat(bulkPriceInput);
    if (isNaN(p) || p < 0) return;
    const updated = variants.map(v => ({
      ...v,
      price: p,
      discount: v.originalPrice ? calculateDiscountPercent(v.originalPrice, p) : v.discount
    }));
    onChangeVariants(updated);
    setBulkPriceInput('');
  };

  const handleApplyBulkOriginalPrice = () => {
    const op = parseFloat(bulkOriginalPriceInput);
    if (isNaN(op) || op < 0) return;
    const updated = variants.map(v => ({
      ...v,
      originalPrice: op,
      discount: v.price ? calculateDiscountPercent(op, v.price) : v.discount
    }));
    onChangeVariants(updated);
    setBulkOriginalPriceInput('');
  };

  const handleApplyBulkStock = () => {
    const updated = variants.map(v => ({
      ...v,
      stockStatus: bulkStockStatus
    }));
    onChangeVariants(updated);
  };

  const handleApplyBulkAffiliateUrl = () => {
    if (!bulkAffiliateUrl.trim()) return;
    const updated = variants.map(v => ({
      ...v,
      affiliateUrl: bulkAffiliateUrl.trim()
    }));
    onChangeVariants(updated);
    setBulkAffiliateUrl('');
  };

  // Calculate total potential combinations
  const potentialCombinationsCount = variantOptions.reduce((acc, opt) => {
    return opt.values.length > 0 ? acc * opt.values.length : acc;
  }, variantOptions.length > 0 ? 1 : 0);

  return (
    <div className="space-y-4 bg-neutral-900/80 p-4 sm:p-5 rounded-2xl border border-neutral-800">
      {/* Header with Switch */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-[#FF5A00]/10 border border-[#FF5A00]/20 rounded-xl text-[#FF5A00] shrink-0 mt-0.5">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-display">
                Variants Product
              </h4>
              {hasVariants && (
                <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md uppercase">
                  {variants.length} Active {variants.length === 1 ? 'Variant' : 'Variants'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Enable multiple sizes, colors, storage options, or pack sizes with custom pricing, images, and buy links.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => onToggleHasVariants(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5A00]"></div>
        </label>
      </div>

      {hasVariants && (
        <div className="space-y-5 pt-1">
          {/* STEP 1: Option Dimensions Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-display flex items-center gap-1.5">
                <span>1. Define Option Types & Values</span>
              </span>
              {variantOptions.length > 0 && potentialCombinationsCount > 0 && (
                <span className="text-[10px] text-neutral-400 font-mono">
                  {potentialCombinationsCount} possible combination{potentialCombinationsCount === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {/* Quick Option Dimension Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-neutral-500 font-semibold mr-1">Quick Add:</span>
              {COMMON_OPTION_PRESETS.map(preset => {
                const isAlreadyAdded = variantOptions.some(o => o.name.toLowerCase() === preset.name.toLowerCase());
                return (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleAddOption(preset.name)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      isAlreadyAdded
                        ? 'bg-neutral-950/40 text-neutral-600 border-neutral-800/40 cursor-not-allowed'
                        : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-emerald-500/50 cursor-pointer'
                    }`}
                  >
                    <span>{preset.name}</span>
                    {!isAlreadyAdded && <Plus className="w-2.5 h-2.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Option Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                onChange={e => setNewOptionName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                placeholder="Or create custom option (e.g. Flavour, Style, Capacity)..."
                className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-[#FF5A00] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddOption()}
                disabled={!newOptionName.trim()}
                className="bg-neutral-800 hover:bg-[#FF5A00] disabled:opacity-40 disabled:hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            {/* Configured Option Dimensions Cards */}
            <div className="space-y-2.5 pt-1">
              {variantOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white font-display uppercase tracking-wider">
                        {opt.name}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md font-mono">
                        {opt.values.length} value{opt.values.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="p-1 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove option type"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Option Values Pills */}
                  <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                    {opt.values.map(val => (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 text-white text-xs font-medium px-2.5 py-1 rounded-lg shadow-2xs group"
                      >
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(opt.id, val)}
                          className="text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove value"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {opt.values.length === 0 && (
                      <span className="text-[11px] text-amber-400/80 italic">
                        No values added yet. Type below and press Enter (or separate by comma).
                      </span>
                    )}
                  </div>

                  {/* Add Value Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={valueInputs[opt.id] || ''}
                      onChange={e => setValueInputs(prev => ({ ...prev, [opt.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(opt.id);
                        }
                      }}
                      placeholder={`Add ${opt.name} values (e.g. Red, Blue or 64GB, 128GB)...`}
                      className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddValue(opt.id)}
                      disabled={!(valueInputs[opt.id] || '').trim()}
                      className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}

              {variantOptions.length === 0 && (
                <div className="p-4 border border-dashed border-neutral-800 rounded-xl text-center space-y-1">
                  <p className="text-xs text-neutral-400 font-medium">No variant options configured yet.</p>
                  <p className="text-[10px] text-neutral-500">
                    Click a preset above (e.g. Color, Size, Storage) or type a custom option to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Matrix Generator & Actions Bar */}
          {variantOptions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (variants.length > 0) {
                      setShowGenerateConfirm(true);
                    } else {
                      handleGenerateMatrix();
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate All Combinations</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddManualVariant}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Single Custom Variant</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="text-xs font-bold text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-850 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Bulk Edit Tools</span>
                {showBulkActions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Generate Confirmation Warning */}
          {showGenerateConfirm && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Re-generate variant combinations?</span>
              </div>
              <p className="text-neutral-300 text-[11px]">
                This will synchronize combinations with current options. Existing prices, images, and URLs for matching combinations will be preserved.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateMatrix}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Confirm & Generate
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateConfirm(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bulk Actions Panel */}
          {showBulkActions && variants.length > 0 && (
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <h5 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Bulk Update All ({variants.length}) Variants
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Bulk Price */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 block">Set Price (₹)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={bulkPriceInput}
                      onChange={e => setBulkPriceInput(e.target.value)}
                      placeholder="e.g. 1999"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkPrice}
                      disabled={!bulkPriceInput}
                      className="bg-neutral-800 hover:bg-emerald-600 disabled:opacity-40 text-white text-[10px] font-bold px-2 rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Bulk MRP */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 block">Set MRP (₹)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={bulkOriginalPriceInput}
                      onChange={e => setBulkOriginalPriceInput(e.target.value)}
                      placeholder="e.g. 2999"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkOriginalPrice}
                      disabled={!bulkOriginalPriceInput}
                      className="bg-neutral-800 hover:bg-emerald-600 disabled:opacity-40 text-white text-[10px] font-bold px-2 rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Bulk Stock */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 block">Stock Status</label>
                  <div className="flex gap-1.5">
                    <select
                      value={bulkStockStatus}
                      onChange={e => setBulkStockStatus(e.target.value as VariantStockStatus)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="limited_stock">Limited Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyBulkStock}
                      className="bg-neutral-800 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Bulk Affiliate URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 block">Affiliate URL</label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={bulkAffiliateUrl}
                      onChange={e => setBulkAffiliateUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkAffiliateUrl}
                      disabled={!bulkAffiliateUrl}
                      className="bg-neutral-800 hover:bg-emerald-600 disabled:opacity-40 text-white text-[10px] font-bold px-2 rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Variant Combinations Table */}
          {variants.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-display">
                  2. Variant Inventory & Pricing Matrix ({variants.length})
                </span>
                <span className="text-[10px] text-neutral-500">
                  Tip: Leave price empty to fallback to product default (₹{basePrice})
                </span>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {variants.map((v, idx) => {
                  const effectiveP = v.price !== undefined && v.price > 0 ? v.price : basePrice;
                  const effectiveOP = v.originalPrice !== undefined && v.originalPrice > 0 ? v.originalPrice : baseOriginalPrice;
                  const disc = calculateDiscountPercent(effectiveOP, effectiveP);
                  const isAvailable = v.isActive !== false && v.stockStatus !== 'out_of_stock' && v.stockStatus !== 'unavailable';

                  return (
                    <div
                      key={v.id || idx}
                      className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                        isAvailable
                          ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                          : 'bg-neutral-950/40 border-neutral-900 opacity-65'
                      }`}
                    >
                      {/* Row Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-neutral-500 font-bold">
                            #{idx + 1}
                          </span>

                          {/* Selections Tag Pills */}
                          {Object.entries(v.options || {}).map(([optKey, optVal]) => (
                            <span
                              key={optKey}
                              className="text-[10px] font-bold bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/20 px-2 py-0.5 rounded-md"
                            >
                              <strong className="text-neutral-400 font-medium">{optKey}:</strong> {String(optVal)}
                            </span>
                          ))}

                          {disc > 0 && (
                            <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              {disc}% OFF
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Active / Inactive Toggle */}
                          <button
                            type="button"
                            onClick={() => handleUpdateVariantField(v.id, 'isActive', v.isActive === false ? true : false)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              v.isActive !== false
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                            }`}
                            title={v.isActive !== false ? "Disable variant" : "Enable variant"}
                          >
                            <Power className="w-2.5 h-2.5" />
                            <span>{v.isActive !== false ? 'Active' : 'Disabled'}</span>
                          </button>

                          {/* Stock Status Selector */}
                          <select
                            value={v.stockStatus || 'in_stock'}
                            onChange={(e) => {
                              const st = e.target.value as VariantStockStatus;
                              handleUpdateVariantField(v.id, 'stockStatus', st);
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border bg-neutral-900 cursor-pointer ${
                              v.stockStatus === 'out_of_stock' || v.stockStatus === 'unavailable'
                                ? 'text-red-400 border-red-500/30'
                                : v.stockStatus === 'limited_stock'
                                ? 'text-amber-400 border-amber-500/30'
                                : 'text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <option value="in_stock">In Stock</option>
                            <option value="limited_stock">Limited Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="unavailable">Unavailable</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        {/* Variant Price */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            value={v.price !== undefined ? v.price : ''}
                            onChange={e => handleUpdateVariantField(v.id, 'price', e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder={`Default: ₹${basePrice}`}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        {/* Variant MRP */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                            MRP (₹)
                          </label>
                          <input
                            type="number"
                            value={v.originalPrice !== undefined ? v.originalPrice : ''}
                            onChange={e => handleUpdateVariantField(v.id, 'originalPrice', e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder={`Default: ₹${baseOriginalPrice || basePrice}`}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        {/* SKU */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                            SKU / Code
                          </label>
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={e => handleUpdateVariantField(v.id, 'sku', e.target.value)}
                            placeholder="e.g. BLK-128GB"
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        {/* Specific Image URL or Select from Product Gallery */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                            Variant Image URL
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="url"
                              value={v.images && v.images.length > 0 ? v.images[0] : ''}
                              onChange={e => handleUpdateVariantField(v.id, 'images', e.target.value ? [e.target.value] : [])}
                              placeholder="Leave blank for cover"
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            />
                            {baseImages.length > 0 && (
                              <div className="relative group/imgselect shrink-0">
                                <button
                                  type="button"
                                  className="p-1.5 bg-neutral-850 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700/60 cursor-pointer"
                                  title="Pick from gallery"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 z-30 hidden group-hover/imgselect:grid grid-cols-3 gap-1 p-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl w-48">
                                  {baseImages.map((imgSrc, imgI) => (
                                    <button
                                      key={imgI}
                                      type="button"
                                      onClick={() => handleUpdateVariantField(v.id, 'images', [imgSrc])}
                                      className="w-full h-12 rounded-lg overflow-hidden border border-neutral-700 hover:border-emerald-500 p-0.5 bg-black cursor-pointer"
                                    >
                                      <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Variant Direct Affiliate URL */}
                        <div className="sm:col-span-2 lg:col-span-4">
                          <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                            Variant Affiliate URL <span className="text-neutral-500 font-normal">(Optional: overrides base retailer link if user picks this variant)</span>
                          </label>
                          <input
                            type="url"
                            value={v.affiliateUrl || ''}
                            onChange={e => handleUpdateVariantField(v.id, 'affiliateUrl', e.target.value)}
                            placeholder="https://amazon.in/dp/...?tag=yourtag (direct variant purchase link)"
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
