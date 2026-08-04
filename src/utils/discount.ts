export interface DiscountResult {
  percentage: number;
  amountSaved: number;
  hasDiscount: boolean;
}

/**
 * Calculates discount percentage and amount saved automatically from original and current prices.
 * Returns percentage rounded to the nearest integer.
 * Returns hasDiscount = false if originalPrice <= currentPrice or invalid.
 */
export function calculateDiscount(originalPrice?: number, currentPrice?: number): DiscountResult {
  if (
    typeof originalPrice !== 'number' ||
    typeof currentPrice !== 'number' ||
    isNaN(originalPrice) ||
    isNaN(currentPrice) ||
    originalPrice <= currentPrice ||
    currentPrice < 0
  ) {
    return {
      percentage: 0,
      amountSaved: 0,
      hasDiscount: false,
    };
  }

  const amountSaved = originalPrice - currentPrice;
  const percentage = Math.round((amountSaved / originalPrice) * 100);

  if (percentage <= 0) {
    return {
      percentage: 0,
      amountSaved: 0,
      hasDiscount: false,
    };
  }

  return {
    percentage,
    amountSaved,
    hasDiscount: true,
  };
}
