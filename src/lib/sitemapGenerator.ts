import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data';
import { slugify, getProductSlug } from './seo';
import { Product } from '../types';

export function isPublicProduct(p: any): boolean {
  if (!p) return false;

  // Status check
  if (p.status) {
    const status = String(p.status).trim().toLowerCase();
    if (['draft', 'archived', 'deleted', 'private', 'admin', 'unpublished'].includes(status)) {
      return false;
    }
  }

  // Boolean flags check
  if (
    p.isDraft === true ||
    p.isArchived === true ||
    p.isDeleted === true ||
    p.isPrivate === true ||
    p.isAdminOnly === true
  ) {
    return false;
  }

  // Must have title or ID
  if (!p.title && !p.id) return false;

  return true;
}

export async function generateSitemapXml(): Promise<string> {
  const domain = 'https://inourbudget.vercel.app';
  const todayIso = new Date().toISOString().split('T')[0];

  // Map to hold products deduped by ID
  const productsMap = new Map<string, any>();

  // 1. Seed from INITIAL_PRODUCTS
  for (const prod of INITIAL_PRODUCTS) {
    if (isPublicProduct(prod)) {
      productsMap.set(prod.id, prod);
    }
  }

  // 2. Query Firestore for live products
  if (isFirebaseConfigured) {
    try {
      const productsRef = collection(db, 'products');
      // Query published products specifically so firestore.rules allows unauthenticated read
      const qPublished = query(productsRef, where('status', '==', 'Published'));
      const snapshot = await getDocs(qPublished);

      if (!snapshot.empty) {
        snapshot.docs.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          if (isPublicProduct(data)) {
            productsMap.set(docSnap.id, data);
          }
        });
      }
    } catch (e) {
      console.warn('[SitemapGenerator] Firestore published products query error:', e);
    }
  }

  // 3. Map for categories deduped by ID/Name
  const categoriesMap = new Map<string, any>();
  for (const cat of INITIAL_CATEGORIES) {
    categoriesMap.set(cat.id || cat.name, cat);
  }

  if (isFirebaseConfigured) {
    try {
      const catRef = collection(db, 'categories');
      const catSnap = await getDocs(catRef);
      if (!catSnap.empty) {
        catSnap.docs.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          categoriesMap.set(docSnap.id || data.name, data);
        });
      }
    } catch (e) {
      console.warn('[SitemapGenerator] Firestore categories query error:', e);
    }
  }

  const publicProducts = Array.from(productsMap.values());
  const categoriesList = Array.from(categoriesMap.values());

  // Static Base Public Pages (no private/user-specific pages like /admin, /profile, /wishlist, /login)
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/explore', priority: '0.9', changefreq: 'daily' },
    { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
    { loc: '/contact', priority: '0.4', changefreq: 'monthly' },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/faq', priority: '0.4', changefreq: 'monthly' },
  ];

  let urlsXml = staticPages
    .map(
      (page) => `  <url>
    <loc>${domain}${page.loc}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  // Categories URLs
  const seenCatSlugs = new Set<string>();
  categoriesList.forEach((cat) => {
    const catSlug = slugify(cat.id || cat.name);
    if (catSlug && !seenCatSlugs.has(catSlug)) {
      seenCatSlugs.add(catSlug);
      urlsXml += `\n  <url>
    <loc>${domain}/category/${catSlug}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  });

  // Product URLs using exact SEO Slugs
  const seenProductSlugs = new Set<string>();
  publicProducts.forEach((prod) => {
    const slug = getProductSlug(prod as Product);
    if (!slug || seenProductSlugs.has(slug)) return;
    seenProductSlugs.add(slug);

    let lastmod = todayIso;
    if ((prod as any).updatedAt && typeof (prod as any).updatedAt === 'string') {
      lastmod = (prod as any).updatedAt.split('T')[0];
    } else if (prod.createdAt && typeof prod.createdAt === 'string') {
      lastmod = prod.createdAt.split('T')[0];
    }

    urlsXml += `\n  <url>
    <loc>${domain}/product/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
}
