import { Product, PurchaseLink } from '../types';

/**
 * Extracts purchase links from a product document.
 * Backward compatibility: If product.purchaseLinks is missing or empty,
 * it automatically converts product.affiliateLinks into purchaseLinks.
 */
export function getPurchaseLinks(product?: Partial<Product> | null): PurchaseLink[] {
  if (!product) return [];

  if (Array.isArray(product.purchaseLinks) && product.purchaseLinks.length > 0) {
    return product.purchaseLinks.map(link => ({
      name: link.name || 'Store',
      url: link.url || ''
    }));
  }

  if (Array.isArray(product.affiliateLinks) && product.affiliateLinks.length > 0) {
    return product.affiliateLinks.map(link => ({
      name: link.platform || 'Store',
      url: link.url || ''
    }));
  }

  return [];
}
