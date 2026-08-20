import React, { useState, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Power,
  Upload,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Link,
  Copy,
  Loader2,
  Check,
  Sparkles
} from 'lucide-react';
import { ProductVariant, ProductVariantOption, VariantStockStatus } from '../types';
import { generateVariantCombinations } from '../utils/variantUtils';
import { calculateDiscountPercent } from '../utils/retailerOffers';
import { uploadFileToStorage } from '../firebase/storage';

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
  productTitle?: string;
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

/**
 * Sub-component for managing multi-image gallery of a single variant
 */
interface VariantGalleryEditorProps {
  variant: ProductVariant;
  onUpdateImages: (images: string[]) => void;
  baseImages: string[];
}

const VariantGalleryEditor: React.FC<VariantGalleryEditorProps> = ({
  variant,
  onUpdateImages,
  baseImages
}) => {
  const images = Array.isArray(variant.images) ? variant.images.filter(img => typeof img === 'string' && img.trim().length > 0) : [];
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isBasePickerOpen, setIsBasePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle uploading multiple image files at once
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 12 - images.length;
    if (remainingSlots <= 0) return;

    const fileList = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: fileList.length });

    const newUrls: string[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress({ current: i + 1, total: fileList.length });
        try {
          const url = await uploadFileToStorage(file, 'products/variants');
          if (url && !newUrls.includes(url) && !images.includes(url)) {
            newUrls.push(url);
          }
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }

      if (newUrls.length > 0) {
        onUpdateImages([...images, ...newUrls].slice(0, 12));
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add single image URL
  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= 12) return;
    if (!images.includes(trimmed)) {
      onUpdateImages([...images, trimmed].slice(0, 12));
    }
    setUrlInput('');
  };

  // Set image as primary (moves it to index 0)
  const handleSetPrimary = (index: number) => {
    if (index === 0 || index >= images.length) return;
    const target = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onUpdateImages([target, ...remaining]);
  };

  // Reorder images left or right
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onUpdateImages(updated);
  };

  // Delete an image from gallery (auto-sets next as primary if index 0 was deleted)
  const handleDeleteImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onUpdateImages(updated);
  };

  // Add image from base product images
  const handlePickBaseImage = (imgUrl: string) => {
    if (images.length >= 12) return;
    if (!images.includes(imgUrl)) {
      onUpdateImages([...images, imgUrl].slice(0, 12));
    }
  };

  // Copy entire product gallery to this variant
  const handleCopyBaseGallery = () => {
    if (baseImages.length === 0) return;
    const combined = [...images];
    baseImages.forEach(img => {
      if (!combined.includes(img) && combined.length < 12) {
        combined.push(img);
      }
    });
    onUpdateImages(combined.slice(0, 12));
  };

  // Clear all images (returns to product-level fallback)
  const handleClearGallery = () => {
    onUpdateImages([]);
  };

  return (
    <div className="space-y-2.5 bg-neutral-900/90 border border-neutral-800/80 rounded-xl p-3 sm:p-3.5">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#FF5A00]/10 border border-[#FF5A00]/20 rounded-md text-[#FF5A00]">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-white uppercase tracking-wider font-display">
              Variant Image Gallery
            </span>
            <span className="text-[10px] text-neutral-400 ml-2 font-mono">
              ({images.length > 0 ? `${images.length} / 12 Photos` : 'Fallback to Product Gallery (0 / 12)'})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Multi-file Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || images.length >= 12}
            className="bg-[#FF5A00]/15 hover:bg-[#FF5A00] text-[#FF5A00] hover:text-white border border-[#FF5A00]/30 hover:border-[#FF5A00] text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={images.length >= 12 ? 'Maximum limit of 12 images reached' : 'Upload one or multiple images from device'}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Uploading {uploadProgress.current}/{uploadProgress.total}...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                <span>+ Upload Images</span>
              </>
            )}
          </button>

          {/* Pick from Product Gallery Dropdown */}
          {baseImages.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBasePickerOpen(!isBasePickerOpen)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Pick images from product gallery"
              >
                <Copy className="w-3 h-3" />
                <span>Product Images</span>
              </button>

              {isBasePickerOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-40 bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-2.5 w-64 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-neutral-300 pb-1 border-b border-neutral-800">
                    <span>Pick from Product Gallery</span>
                    <button
                      type="button"
                      onClick={() => setIsBasePickerOpen(false)}
                      className="text-neutral-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                    {baseImages.map((src, i) => {
                      const isAdded = images.includes(src);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handlePickBaseImage(src)}
                          className={`relative aspect-square rounded-lg overflow-hidden border p-0.5 bg-black cursor-pointer transition-all ${
                            isAdded
                              ? 'border-emerald-500 ring-1 ring-emerald-500/50 opacity-60'
                              : 'border-neutral-750 hover:border-[#FF5A00]'
                          }`}
                          title={isAdded ? "Already added" : "Click to add to variant"}
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {isAdded && (
                            <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1 flex justify-between border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyBaseGallery();
                        setIsBasePickerOpen(false);
                      }}
                      className="text-[9px] font-bold text-[#FF5A00] hover:underline"
                    >
                      Add All ({baseImages.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clear Gallery Button */}
          {images.length > 0 && (
            <button
              type="button"
              onClick={handleClearGallery}
              className="text-neutral-500 hover:text-red-400 text-[10px] font-bold px-1.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Remove variant-specific gallery and revert to product default"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="flex gap-1.5 items-center">
        <div className="relative flex-1">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="Paste image URL (https://...) and press Add"
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim() || images.length >= 12}
          className="bg-neutral-800 hover:bg-[#FF5A00] disabled:opacity-40 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
        >
          + Add URL
        </button>
      </div>

      {/* Thumbnail Gallery Grid */}
      {images.length > 0 ? (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pt-1">
            {images.map((imgUrl, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={`${imgUrl}-${idx}`}
                  className={`group/thumb relative aspect-square rounded-xl overflow-hidden border bg-black transition-all ${
                    isPrimary
                      ? 'border-[#FF5A00] ring-2 ring-[#FF5A00]/30 shadow-md shadow-[#FF5A00]/10'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Variant image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-1 left-1 right-1 flex items-center justify-between pointer-events-none z-10">
                    {isPrimary ? (
                      <span className="text-[8px] font-black bg-[#FF5A00] text-white px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 font-display uppercase tracking-wider">
                        <Star className="w-2 h-2 fill-white" /> Primary
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold bg-neutral-900/80 backdrop-blur-xs text-neutral-300 px-1 py-0.5 rounded border border-white/10 font-mono">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Hover Actions Toolbar */}
                  <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-xs opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col justify-between p-1 z-20">
                    <div className="flex justify-end gap-1">
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx)}
                        className="p-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-md transition-colors cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Set Primary Button */}
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="w-full py-0.5 px-1 bg-[#FF5A00]/20 hover:bg-[#FF5A00] text-[#FF5A00] hover:text-white text-[8px] font-bold rounded flex items-center justify-center gap-0.5 transition-colors cursor-pointer uppercase"
                        title="Make this the primary cover image"
                      >
                        <Star className="w-2 h-2 fill-current" /> Set Primary
                      </button>
                    )}

                    {/* Reorder Arrows */}
                    <div className="flex justify-between gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, 'left')}
                        className="p-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-25 text-white rounded cursor-pointer disabled:cursor-not-allowed"
                        title="Move Left"
                      >
                        <ChevronLeft className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMoveImage(idx, 'right')}
                        className="p-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-25 text-white rounded cursor-pointer disabled:cursor-not-allowed"
                        title="Move Right"
                      >
                        <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-neutral-500 italic">
            Tip: Image #1 is the Primary cover image. Hover on any image to reorder, make primary, or delete.
          </p>
        </div>
      ) : (
        <div className="p-3 bg-neutral-950/60 border border-neutral-850 rounded-xl text-center flex items-center justify-between gap-2">
          <span className="text-[10px] text-neutral-500">
            No variant-specific images yet. This variant will automatically display the product-level gallery ({baseImages.length} images).
          </span>
          {baseImages.length > 0 && (
            <button
              type="button"
              onClick={handleCopyBaseGallery}
              className="text-[10px] font-bold text-[#FF5A00] hover:underline cursor-pointer shrink-0"
            >
              Use Product Gallery
            </button>
          )}
        </div>
      )}
    </div>
  );
};

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
  productTitle = '',
}) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [valueInputs, setValueInputs] = useState<{ [optionId: string]: string }>({});
  const [bulkPriceInput, setBulkPriceInput] = useState<string>('');
  const [bulkOriginalPriceInput, setBulkOriginalPriceInput] = useState<string>('');
  const [bulkStockStatus, setBulkStockStatus] = useState<VariantStockStatus>('in_stock');
  const [bulkAffiliateUrl, setBulkAffiliateUrl] = useState<string>('');
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState<string>('');
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
      title: '',
      options: initialSelections,
      price: basePrice || 0,
      originalPrice: baseOriginalPrice || basePrice || 0,
      discount: calculateDiscountPercent(baseOriginalPrice || basePrice || 0, basePrice || 0),
      stockStatus: 'in_stock',
      isActive: true,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      images: []
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

  const handleBulkAutoGenerateTitles = () => {
    const prefix = (bulkTitlePrefix || productTitle || 'Product').trim();
    const updated = variants.map(v => {
      const optionDetails = Object.values(v.options || {}).filter(Boolean).join(' – ');
      const newTitle = optionDetails ? `${prefix} – ${optionDetails}` : prefix;
      return {
        ...v,
        title: newTitle
      };
    });
    onChangeVariants(updated);
    setBulkTitlePrefix('');
  };

  const handleBulkClearTitles = () => {
    const updated = variants.map(v => ({
      ...v,
      title: ''
    }));
    onChangeVariants(updated);
  };

  const handleBulkCopyProductGallery = () => {
    if (baseImages.length === 0) return;
    const updated = variants.map(v => ({
      ...v,
      images: [...baseImages.slice(0, 12)]
    }));
    onChangeVariants(updated);
  };

  const handleBulkClearGalleries = () => {
    const updated = variants.map(v => ({
      ...v,
      images: []
    }));
    onChangeVariants(updated);
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
              Enable multiple sizes, colors, storage options, or pack sizes with independent multi-image galleries, custom pricing, and buy links.
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
        <div className="space-y-6 pt-2">
          {/* STEP 1: Option Dimensions Definition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-display">
                1. Variant Options & Attributes
              </span>
              <span className="text-[10px] text-neutral-500">
                (e.g., Color, Size, Storage, Pack Size)
              </span>
            </div>

            {/* Existing Options List */}
            <div className="space-y-3">
              {variantOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {opt.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        ({opt.values.length} {opt.values.length === 1 ? 'choice' : 'choices'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="text-neutral-500 hover:text-red-400 text-xs transition-colors cursor-pointer p-1"
                      title={`Remove ${opt.name} option`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Values Chip Container */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {opt.values.map((val) => (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1 bg-neutral-900 border border-neutral-800 text-neutral-200 text-[11px] font-medium px-2.5 py-1 rounded-lg"
                      >
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(opt.id, val)}
                          className="text-neutral-500 hover:text-red-400 cursor-pointer ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}

                    {/* Quick Input for Adding Value */}
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={valueInputs[opt.id] || ''}
                        onChange={(e) => setValueInputs({ ...valueInputs, [opt.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddValue(opt.id);
                          }
                        }}
                        placeholder="Add value (or comma-separated) + Enter"
                        className="bg-neutral-900 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-neutral-600 focus:outline-none w-52"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddValue(opt.id)}
                        className="p-1 bg-[#FF5A00]/20 hover:bg-[#FF5A00] text-[#FF5A00] hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Add value"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Preset Buttons & Add Custom Option */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mr-1">
                  Quick Add:
                </span>
                {COMMON_OPTION_PRESETS.map((preset) => {
                  const alreadyAdded = variantOptions.some(
                    (o) => o.name.toLowerCase() === preset.name.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddOption(preset.name)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        alreadyAdded
                          ? 'bg-neutral-950 text-neutral-600 border-neutral-900 cursor-not-allowed'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-[#FF5A00]'
                      }`}
                    >
                      + {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Custom Option Name Input */}
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Custom Option Name (e.g. Model, Flavor)"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption()}
                  disabled={!newOptionName.trim()}
                  className="bg-neutral-800 hover:bg-[#FF5A00] disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  Add Option
                </button>
              </div>
            </div>
          </div>

          {/* GENERATION / ACTION CONTROLS */}
          {variantOptions.length > 0 && (
            <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-display">
                      Variant Matrix Generator
                    </span>
                    <span className="text-[10px] font-mono text-[#FF5A00] bg-[#FF5A00]/10 border border-[#FF5A00]/20 px-2 py-0.5 rounded">
                      {potentialCombinationsCount} Combinations
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Automatically generate every combination across your option choices.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateConfirm(true)}
                    className="bg-[#FF5A00] hover:bg-[#FF5A00]/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Combinations</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddManualVariant}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    + Add Custom Row
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Bulk Tools</span>
                    {showBulkActions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Confirmation Prompt for Regenerating Matrix */}
              {showGenerateConfirm && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-200">
                      <strong>Regenerate variant matrix?</strong> This will build {potentialCombinationsCount} combination rows while preserving any existing price, gallery images, and custom URLs you already configured.
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGenerateConfirm(false)}
                      className="px-2.5 py-1 text-[11px] font-bold text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateMatrix}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[11px] font-black rounded-lg cursor-pointer"
                    >
                      Confirm Generate
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BULK ACTIONS ACCORDION */}
          {showBulkActions && variants.length > 0 && (
            <div className="p-3.5 bg-neutral-950/90 border border-neutral-800 rounded-xl space-y-3">
              <h5 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A00]" />
                Bulk Apply to All {variants.length} Variants
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

              {/* Bulk Title Tools */}
              <div className="pt-2 border-t border-neutral-850 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-display">
                    Bulk Variant Titles:
                  </span>
                  <span className="text-[9px] text-neutral-500">
                    Auto-formats as: [Title] – [Options]
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={bulkTitlePrefix}
                    onChange={e => setBulkTitlePrefix(e.target.value)}
                    placeholder={productTitle ? `Prefix (Default: "${productTitle}")` : 'Enter product title prefix...'}
                    className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-neutral-600"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBulkAutoGenerateTitles}
                      className="bg-neutral-850 hover:bg-[#FF5A00]/20 text-[#FF5A00] hover:text-white border border-[#FF5A00]/30 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Generate All Titles</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkClearTitles}
                      className="bg-neutral-850 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 border border-neutral-750 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Titles
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Gallery Tools */}
              <div className="pt-2 border-t border-neutral-850 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] text-neutral-400 font-medium">
                  Bulk Gallery Operations:
                </span>
                <div className="flex items-center gap-2">
                  {baseImages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkCopyProductGallery}
                      className="bg-neutral-850 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-750 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Copy Product Gallery to All Variants
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleBulkClearGalleries}
                    className="bg-neutral-850 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 border border-neutral-750 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear All Variant Galleries
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Variant Combinations Table */}
          {variants.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-display">
                  2. Variant Inventory, Galleries & Pricing Matrix ({variants.length})
                </span>
                <span className="text-[10px] text-neutral-500">
                  Tip: Leave price empty to fallback to product default (₹{basePrice})
                </span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {variants.map((v, idx) => {
                  const effectiveP = v.price !== undefined && v.price > 0 ? v.price : basePrice;
                  const effectiveOP = v.originalPrice !== undefined && v.originalPrice > 0 ? v.originalPrice : baseOriginalPrice;
                  const disc = calculateDiscountPercent(effectiveOP, effectiveP);
                  const isAvailable = v.isActive !== false && v.stockStatus !== 'out_of_stock' && v.stockStatus !== 'unavailable';
                  const variantImageCount = Array.isArray(v.images) ? v.images.filter(Boolean).length : 0;

                  return (
                    <div
                      key={v.id || idx}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-3.5 ${
                        isAvailable
                          ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                          : 'bg-neutral-950/40 border-neutral-900 opacity-65'
                      }`}
                    >
                      {/* Row Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2.5">
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

                          {/* Photos Count Badge */}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            variantImageCount > 0
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-neutral-850 text-neutral-400 border-neutral-750'
                          }`}>
                            {variantImageCount > 0 ? `${variantImageCount} Photos` : 'Default Gallery'}
                          </span>

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

                      {/* Fields Grid (Variant Title, Price, MRP, SKU, Affiliate Link) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        {/* Variant-Specific Title */}
                        <div className="sm:col-span-2 lg:col-span-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-neutral-300 flex items-center gap-1.5 font-display">
                              <span>Variant-Specific Title</span>
                              <span className="text-neutral-500 font-normal">(Optional: overrides product title when this variant is active)</span>
                            </label>
                            {v.title && v.title.trim().length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleUpdateVariantField(v.id, 'title', '')}
                                className="text-[9px] text-neutral-500 hover:text-red-400 font-mono transition-colors cursor-pointer"
                                title="Clear custom title to use base product title"
                              >
                                Clear Title
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            maxLength={250}
                            value={v.title || ''}
                            onChange={e => handleUpdateVariantField(v.id, 'title', e.target.value)}
                            placeholder={productTitle ? `Default fallback: "${productTitle}"` : 'Leave empty to fallback to default product title'}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF5A00] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none transition-colors"
                          />
                          <div className="flex items-center justify-between text-[9px] text-neutral-500 mt-1">
                            <span>
                              {v.title && v.title.trim().length > 0 ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Custom title active
                                </span>
                              ) : (
                                <span className="text-neutral-500">Using default product title</span>
                              )}
                            </span>
                            <span>{(v.title || '').length} / 250</span>
                          </div>
                        </div>

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
                            placeholder="e.g. BLK-LRG-1PK"
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        {/* Variant Direct Affiliate URL */}
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                            Variant Buy Link / Affiliate URL <span className="text-neutral-500 font-normal">(Optional: overrides base retailer link if user picks this variant)</span>
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

                      {/* UPGRADED MULTI-IMAGE VARIANT GALLERY EDITOR */}
                      <VariantGalleryEditor
                        variant={v}
                        onUpdateImages={(newImages) => handleUpdateVariantField(v.id, 'images', newImages)}
                        baseImages={baseImages}
                      />
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
