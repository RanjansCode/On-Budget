import { Product } from '../types';

/**
 * Sorts an array of products by creation timestamp in DESCENDING order (newest first).
 * - Primary sort: createdAt DESC (newest timestamp first).
 * - Secondary sort: id DESC (stable, deterministic ordering if timestamps match).
 * - Missing / invalid timestamps are safely handled by falling back to 0 (oldest).
 * - Does not mutate the original array.
 */
export function sortProductsByNewest(products: Product[]): Product[] {
  if (!Array.isArray(products)) return [];
  return [...products].sort((a, b) => {
    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

    const validTimeA = Number.isNaN(timeA) ? 0 : timeA;
    const validTimeB = Number.isNaN(timeB) ? 0 : timeB;

    if (validTimeB !== validTimeA) {
      return validTimeB - validTimeA;
    }

    const idA = a?.id || '';
    const idB = b?.id || '';
    return idB.localeCompare(idA);
  });
}
