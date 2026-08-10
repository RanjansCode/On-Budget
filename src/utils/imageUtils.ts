import { Product } from '../types';

/**
 * Helper to safely extract all image URLs for a product with backwards compatibility.
 * Falls back to single legacy `image` or a high-quality default placeholder if missing.
 */
export function getProductImages(product?: Partial<Product> | null): string[] {
  if (!product) {
    return ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'];
  }
  
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter(img => typeof img === 'string' && img.trim().length > 0);
    if (validImages.length > 0) {
      return validImages;
    }
  }

  if ((product as any)?.image && typeof (product as any).image === 'string') {
    return [(product as any).image];
  }

  return ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'];
}

/**
 * Returns the primary/main cover image URL for a product.
 */
export function getProductMainImage(product?: Partial<Product> | null): string {
  const images = getProductImages(product);
  return images[0];
}
