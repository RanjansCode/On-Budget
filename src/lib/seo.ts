/**
 * SEO Utilities, Meta Tag Injectors, Schema Generators and Slug Helpers
 */

import { Product } from '../types';

/**
 * Converts any text into a URL-friendly slug
 * e.g. "MAONO AU-400 Lavalier Microphone!" -> "maono-au-400-lavalier-microphone"
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from ends
}

/**
 * Generates a unique slug among existing products.
 * If slug already exists for another product, appends -2, -3, -4 etc.
 */
export function generateUniqueSlug(
  title: string,
  currentProductId: string,
  existingProducts: Product[],
  currentSlug?: string
): string {
  const baseSlug = currentSlug && currentSlug.trim()
    ? slugify(currentSlug)
    : slugify(title) || 'product';

  let candidateSlug = baseSlug;
  let counter = 2;

  while (
    existingProducts.some(
      p => p.id !== currentProductId &&
           p.seoSlug &&
           p.seoSlug.toLowerCase() === candidateSlug.toLowerCase()
    )
  ) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidateSlug;
}

/**
 * Returns the effective SEO slug for a product
 */
export function getProductSlug(product: Product): string {
  if (product.seoSlug && product.seoSlug.trim()) {
    return slugify(product.seoSlug);
  }
  return slugify(product.title) || product.id;
}

/**
 * Resolves current host/domain name safely
 */
export function getDomain(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://inourbudget.vercel.app';
}

/**
 * Generates absolute canonical URL
 */
export function getCanonicalUrl(path: string, domain?: string): string {
  const host = domain || 'https://inourbudget.vercel.app';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${host}${cleanPath}`;
}

/**
 * Structured Data: Schema.org Product JSON-LD
 */
export function generateProductSchema(product: Product, domain: string = 'https://inourbudget.vercel.app') {
  const slug = getProductSlug(product);
  const productUrl = getCanonicalUrl(`/product/${slug}`, domain);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : undefined;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    url: productUrl,
    name: product.seoTitle || product.title,
    description: product.seoDescription || product.description || `Buy ${product.title} on In Our Budget`,
    sku: product.id,
    mpn: product.id,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: product.brand?.trim() || 'In Our Budget'
    }
  };

  if (product.images && product.images.length > 0) {
    schema.image = product.images;
  }

  if (product.price !== undefined && product.price !== null) {
    schema.offers = {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2028-12-31',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'In Our Budget'
      }
    };

    if (product.originalPrice && product.originalPrice > product.price) {
      schema.offers.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: product.originalPrice,
        priceCurrency: 'INR',
        valueAddedTaxIncluded: true
      };
    }
  }

  // Only include aggregateRating if a valid rating exists on the product
  const ratingVal = product.creatorReview?.rating || product.rating;
  if (ratingVal && ratingVal > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingVal,
      bestRating: 5,
      worstRating: 1,
      ratingCount: 1
    };
  }

  // Include review schema if creator review text exists
  if (product.creatorReview?.reviewText) {
    schema.review = {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'In Our Budget Team'
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: product.creatorReview.rating || 5,
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: product.creatorReview.reviewText
    };
  }

  if (discountPercent) {
    schema.discount = `${discountPercent}% OFF`;
  }

  return schema;
}

export interface SEOAnalysisResult {
  score: number; // 0 to 100
  titleLength: number;
  titleStatus: 'good' | 'short' | 'long' | 'missing';
  descriptionLength: number;
  descriptionStatus: 'good' | 'short' | 'long' | 'missing';
  missingFields: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Calculates real-time SEO score and diagnostic metrics for a product
 */
export function calculateProductSEOScore(
  productPartial: {
    title?: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoSlug?: string;
    images?: string[];
    searchTags?: string[];
    brand?: string;
    category?: string;
  }
): SEOAnalysisResult {
  let score = 100;
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const title = (productPartial.seoTitle || productPartial.title || '').trim();
  const titleLength = title.length;
  let titleStatus: SEOAnalysisResult['titleStatus'] = 'good';

  if (!title) {
    titleStatus = 'missing';
    score -= 25;
    missingFields.push('SEO Title');
    warnings.push('Title is completely missing.');
  } else if (titleLength < 30) {
    titleStatus = 'short';
    score -= 10;
    warnings.push(`SEO Title is too short (${titleLength} chars). Aim for 30–60 characters.`);
  } else if (titleLength > 60) {
    titleStatus = 'long';
    score -= 10;
    warnings.push(`SEO Title is too long (${titleLength} chars). Search engines may truncate it past 60 chars.`);
  }

  const desc = (productPartial.seoDescription || productPartial.description || '').trim();
  const descriptionLength = desc.length;
  let descriptionStatus: SEOAnalysisResult['descriptionStatus'] = 'good';

  if (!desc) {
    descriptionStatus = 'missing';
    score -= 25;
    missingFields.push('Meta Description');
    warnings.push('Meta description is missing.');
  } else if (descriptionLength < 70) {
    descriptionStatus = 'short';
    score -= 10;
    warnings.push(`Meta Description is too short (${descriptionLength} chars). Aim for 120–160 characters.`);
  } else if (descriptionLength > 160) {
    descriptionStatus = 'long';
    score -= 8;
    warnings.push(`Meta Description exceeds 160 chars (${descriptionLength} chars) and will be truncated on Google.`);
  }

  // Slug check
  const slug = (productPartial.seoSlug || '').trim();
  if (!slug) {
    score -= 15;
    missingFields.push('SEO URL Slug');
    suggestions.push('Add a clean SEO URL slug for human & bot readable link structure.');
  } else if (slug.length > 60) {
    score -= 5;
    warnings.push('URL Slug is quite long. Short, keyword-dense slugs rank best.');
  }

  // Search Tags check
  const tags = productPartial.searchTags || [];
  if (tags.length === 0) {
    score -= 10;
    missingFields.push('Search Tags / Keywords');
    suggestions.push('Add search tags to boost internal search and meta keywords ranking.');
  } else if (tags.length < 3) {
    score -= 5;
    suggestions.push('Add at least 3-5 search tags for better topical authority.');
  }

  // Images check
  const imgs = productPartial.images || [];
  if (imgs.length === 0) {
    score -= 10;
    missingFields.push('Product Images');
    warnings.push('At least 1 product image is required for OpenGraph & Google Rich Results.');
  }

  // Brand check
  if (!productPartial.brand || !productPartial.brand.trim()) {
    score -= 5;
    missingFields.push('Brand Name');
    suggestions.push('Adding a brand name improves Product Schema validation.');
  }

  // Final score clamping
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: finalScore,
    titleLength,
    titleStatus,
    descriptionLength,
    descriptionStatus,
    missingFields,
    warnings,
    suggestions
  };
}

/**
 * Structured Data: Schema.org BreadcrumbList
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  domain: string = getDomain()
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.url, domain)
    }))
  };
}

/**
 * Structured Data: Schema.org Organization
 */
export function generateOrganizationSchema(domain: string = getDomain()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'In Our Budget',
    url: domain,
    logo: `${domain}/logo.png`,
    sameAs: [
      'https://whatsapp.com/channel/0029Vb8SOImD8SDvTKYTcr15'
    ]
  };
}

/**
 * Structured Data: Schema.org WebSite & SearchAction
 */
export function generateWebSiteSchema(domain: string = getDomain()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'On Budget - Curated Budget Gadgets',
    url: domain,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${domain}/?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export interface MetaOptions {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  imageUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  jsonLdSchemas?: any[];
}

/**
 * Injects or updates document head meta tags dynamically
 */
export function updateDocumentSEO({
  title,
  description,
  keywords,
  canonicalUrl,
  imageUrl,
  ogType = 'website',
  jsonLdSchemas = []
}: MetaOptions) {
  if (typeof document === 'undefined') return;

  // 1. Update <title>
  document.title = title;

  // Helper function to set or update meta tags
  const setMeta = (attrName: string, attrVal: string, content: string) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrVal);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 2. Standard Meta Tags
  setMeta('name', 'description', description);
  if (keywords && keywords.length > 0) {
    setMeta('name', 'keywords', keywords.join(', '));
  }

  // 3. Canonical Link Tag
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // 4. Open Graph Meta Tags
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:type', ogType);
  if (imageUrl) {
    setMeta('property', 'og:image', imageUrl);
  }

  // 5. Twitter Card Meta Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  if (imageUrl) {
    setMeta('name', 'twitter:image', imageUrl);
  }

  // 6. JSON-LD Schemas
  // Clear old dynamic JSON-LD scripts created by us
  const oldScripts = document.querySelectorAll('script[data-seo-jsonld="true"]');
  oldScripts.forEach(script => script.remove());

  // Inject new JSON-LD scripts
  jsonLdSchemas.forEach((schema, idx) => {
    if (!schema) return;
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo-jsonld', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

/**
 * Extracts a product ID or slug from any product URL path
 * Supports: /product/:slug, /products/:slug, /p/:slug
 * Handles trailing slashes, URL parameters, decoding, etc.
 */
export function extractProductSlugFromPath(pathname?: string): string | null {
  if (typeof window === 'undefined') return null;
  const currentPath = pathname || window.location.pathname;

  // 1. Check URL query search params e.g. ?product=slug or ?p=slug or ?id=id
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const querySlug = searchParams.get('product') || searchParams.get('p') || searchParams.get('id');
    if (querySlug && querySlug.trim()) {
      return decodeURIComponent(querySlug.trim());
    }
  } catch {
    // Ignore URL search params parse errors
  }

  // 2. Check hash fragments e.g. #product/slug or #/product/slug or #p/slug
  const hash = window.location.hash || '';
  if (hash.includes('product/') || hash.includes('p/')) {
    const parts = hash.split(/product\/|p\//);
    if (parts[1]) {
      const rawHashSlug = parts[1].split('?')[0].split('&')[0].trim();
      if (rawHashSlug) {
        try {
          return decodeURIComponent(rawHashSlug);
        } catch {
          return rawHashSlug;
        }
      }
    }
  }

  // 3. Clean path string (strip query params and hashes if passed in pathname)
  let cleanPath = currentPath.split('?')[0].split('#')[0].trim().replace(/\/+$/, '');

  const prefixes = ['/product/', '/products/', '/p/'];
  for (const prefix of prefixes) {
    if (cleanPath.startsWith(prefix)) {
      let rawSlug = cleanPath.slice(prefix.length).trim();
      if (rawSlug) {
        try {
          rawSlug = decodeURIComponent(rawSlug);
        } catch {
          // Keep raw if decode fails
        }
        return rawSlug;
      }
    }
  }

  return null;
}

/**
 * Finds a product in the given products array matching an ID, seoSlug, or title-slug.
 */
export function findProductByIdentifier(identifier: string | null | undefined, products: Product[]): Product | null {
  if (!identifier || !products || products.length === 0) return null;
  const target = identifier.trim().toLowerCase().replace(/\/+$/, '');

  // 1. Exact match on ID or seoSlug
  const exact = products.find(p =>
    p.id.toLowerCase() === target ||
    (p.seoSlug && p.seoSlug.trim().toLowerCase() === target)
  );
  if (exact) return exact;

  // 2. Match on slugified seoSlug or slugified title
  const slugMatch = products.find(p => {
    const pSlug = p.seoSlug ? slugify(p.seoSlug) : '';
    const pTitleSlug = slugify(p.title);
    return (pSlug && pSlug === target) || (pTitleSlug && pTitleSlug === target);
  });
  if (slugMatch) return slugMatch;

  // 3. Fallback partial match if target contains ID
  const fallback = products.find(p => p.id.toLowerCase() === target || target.includes(p.id.toLowerCase()));
  return fallback || null;
}
