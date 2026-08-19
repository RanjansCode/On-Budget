import React from 'react';
import { Check, AlertCircle, XCircle, Clock } from 'lucide-react';
import { ProductVariant, ProductVariantOption, VariantStockStatus } from '../types';
import { checkOptionAvailability, getColorHex, getVariantDisplayName } from '../utils/variantUtils';

interface ProductVariantSelectorProps {
  variantOptions: ProductVariantOption[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  onSelectOption: (optionName: string, optionValue: string) => void;
  selectedVariant: ProductVariant | null;
  className?: string;
}

export default function ProductVariantSelector({
  variantOptions,
  variants,
  selectedOptions,
  onSelectOption,
  selectedVariant,
  className = '',
}: ProductVariantSelectorProps) {
  if (!variantOptions || variantOptions.length === 0 || !variants || variants.length === 0) {
    return null;
  }

  // Stock status badge component
  const renderStockBadge = (status?: VariantStockStatus) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1 rounded-lg">
            <Check className="w-3.5 h-3.5" />
            <span>In Stock</span>
          </span>
        );
      case 'limited_stock':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span>Limited Stock Available</span>
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 px-2.5 py-1 rounded-lg">
            <XCircle className="w-3.5 h-3.5" />
            <span>Out of Stock</span>
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Currently Unavailable</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1 rounded-lg">
            <Check className="w-3.5 h-3.5" />
            <span>In Stock</span>
          </span>
        );
    }
  };

  return (
    <div className={`p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl space-y-4 ${className}`}>
      {/* Option Dimensions List */}
      <div className="space-y-4">
        {variantOptions.map((opt) => {
          const optName = opt.name;
          const isColorType = /color|colour|shade/i.test(optName);
          const currentVal = selectedOptions[optName] || opt.values[0] || '';

          return (
            <div key={opt.id || optName} className="space-y-2">
              {/* Option Title & Selected Value Preview */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  {optName}:{' '}
                  <span className="font-extrabold text-slate-900 dark:text-white ml-1 font-display">
                    {currentVal}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {opt.values.length} {opt.values.length === 1 ? 'option' : 'options'}
                </span>
              </div>

              {/* Option Values Pill / Swatch Grid */}
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Select ${optName}`}>
                {opt.values.map((val) => {
                  const isSelected = (selectedOptions[optName] || '').toLowerCase() === val.toLowerCase();
                  const availability = checkOptionAvailability(variants, selectedOptions, optName, val);
                  const colorHex = isColorType ? getColorHex(val) : null;
                  const isLightColor = colorHex && ['#ffffff', '#f5f5f0', '#d1d5db'].includes(colorHex.toLowerCase());

                  // Disabled/Out of stock styles
                  const isOutOfStock = !availability.isInStock;
                  const isUnavailable = !availability.exists && !availability.isActive;

                  return (
                    <button
                      key={val}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => onSelectOption(optName, val)}
                      className={`relative min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none font-sans ${
                        isSelected
                          ? 'bg-[#FF5A00] text-white shadow-sm ring-2 ring-[#FF5A00]/30 border border-[#FF5A00] scale-[1.02]'
                          : isUnavailable
                          ? 'bg-slate-100/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-80'
                          : isOutOfStock
                          ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-400 opacity-80'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-[#FF5A00]/50 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                      title={
                        isOutOfStock
                          ? `${val} (Out of stock for selected combination)`
                          : `${optName}: ${val}`
                      }
                    >
                      {/* Color Circle Swatch if applicable */}
                      {isColorType && colorHex && (
                        <span
                          className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border ${
                            isLightColor ? 'border-slate-300' : 'border-black/20'
                          } ${isSelected ? 'ring-1 ring-white' : ''}`}
                          style={{ backgroundColor: colorHex }}
                        />
                      )}

                      <span>{val}</span>

                      {/* Selected Checkmark */}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0 text-white stroke-[2.5]" />
                      )}

                      {/* Out of Stock Strikethrough/Badge Indicator */}
                      {!isSelected && isOutOfStock && (
                        <span className="text-[9px] font-normal text-rose-500/90 ml-0.5">
                          (OOS)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Variant Summary & Stock Status Footer */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {renderStockBadge(selectedVariant?.stockStatus)}

          {selectedVariant?.sku && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2 py-0.5 rounded-md">
              SKU: {selectedVariant.sku}
            </span>
          )}
        </div>

        {selectedVariant && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">
            Variant: <strong className="text-slate-800 dark:text-slate-200 not-italic font-semibold">{getVariantDisplayName(selectedVariant)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
