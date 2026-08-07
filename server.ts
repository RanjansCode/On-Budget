/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './src/data';
import { slugify } from './src/lib/seo';
import { db, isFirebaseConfigured } from './src/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI on the server with recommended User-Agent header for tracking
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Middleware for parsing JSON bodies
app.use(express.json());

// 1. AUTOMATIC ROBOTS.TXT
app.get('/google:id.html', (req, res) => {
  const filename = `google${req.params.id}.html`;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`google-site-verification: ${filename}`);
});

app.get('/robots.txt', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'inourbudget.vercel.app';
  const domain = `${protocol}://${host}`;

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /profile/private
Disallow: /api

Sitemap: ${domain}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(robotsTxt);
});

// 2. AUTOMATIC DYNAMIC SITEMAP.XML
app.get('/sitemap.xml', async (req, res) => {
  try {
    const domain = 'https://inourbudget.vercel.app';

    let productsList = INITIAL_PRODUCTS;
    let categoriesList = INITIAL_CATEGORIES;

    if (isFirebaseConfigured) {
      try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        if (!snapshot.empty) {
          const fetchedProducts = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as any))
            .filter(p => p.status !== 'Draft' && p.status !== 'Archived');
          if (fetchedProducts.length > 0) {
            productsList = fetchedProducts;
          }
        }
      } catch (e) {
        console.warn('Firestore products query fallback for sitemap:', e);
      }

      try {
        const catRef = collection(db, 'categories');
        const catSnap = await getDocs(catRef);
        if (!catSnap.empty) {
          const fetchedCategories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          if (fetchedCategories.length > 0) {
            categoriesList = fetchedCategories;
          }
        }
      } catch (e) {
        console.warn('Firestore categories query fallback for sitemap:', e);
      }
    }

    const todayIso = new Date().toISOString().split('T')[0];

    // Static Base Pages
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/explore', priority: '0.9', changefreq: 'daily' },
      { loc: '/wishlist', priority: '0.6', changefreq: 'weekly' },
      { loc: '/profile', priority: '0.5', changefreq: 'monthly' },
      { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
      { loc: '/contact', priority: '0.4', changefreq: 'monthly' },
      { loc: '/about', priority: '0.5', changefreq: 'monthly' },
      { loc: '/faq', priority: '0.4', changefreq: 'monthly' },
    ];

    let urlsXml = staticPages.map(page => `  <url>
    <loc>${domain}${page.loc}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    // Categories URLs
    categoriesList.forEach(cat => {
      const catSlug = slugify(cat.id || cat.name);
      urlsXml += `\n  <url>
    <loc>${domain}/category/${catSlug}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Product URLs using SEO Slugs
    productsList.forEach(prod => {
      const slug = prod.seoSlug && prod.seoSlug.trim()
        ? slugify(prod.seoSlug)
        : slugify(prod.title) || prod.id;

      const lastmod = (prod as any).updatedAt
        ? (prod as any).updatedAt.split('T')[0]
        : (prod.createdAt ? prod.createdAt.split('T')[0] : todayIso);

      urlsXml += `\n  <url>
    <loc>${domain}/product/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(sitemapXml);
  } catch (err: any) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// API: AI Product recommendations
app.post('/api/gemini/recommend', async (req, res) => {
  try {
    const { prompt, availableProducts } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'User query is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        text: "I am ready to recommend budget gadgets, but the **GEMINI_API_KEY** is currently missing from secrets. Please configure it in **Settings > Secrets** so we can chat!"
      });
    }

    const systemInstruction = `
You are BudgetBuddy AI, a friendly and extremely clever curator assistant for "On Budget" (a curator-reviewed e-commerce platform).
Your goal is to recommend the best products for a user based on their budget, desires, and setup themes.

Available tested products database in JSON format:
${JSON.stringify(availableProducts, null, 2)}

Instructions:
1. Parse the user's budget (e.g. ₹100, ₹200, under ₹500, etc.) and category request.
2. Recommend the best matching item(s) from the database. Be very specific.
3. Keep your advice humble, conversational, objective, and highly descriptive.
4. Mention the price in INR (₹) and the brand.
5. If you recommend any product from the database, you MUST reference its exact product ID (e.g. 'prod-1', 'prod-2') somewhere in your response. This allows the client UI to automatically attach the product card next to your message.
6. If no exact match exists, recommend the closest alternative in our catalog, or give them smart budget DIY tips.
7. Use clean, bold markdown formatting for readability. Do not praise yourself or sound overly promotional.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/recommend:', error);
    res.status(500).json({ error: error.message || 'Error occurred while querying Gemini API' });
  }
});

// API: AI Review summary
app.post('/api/gemini/summary', async (req, res) => {
  try {
    const { title, description, whyIRecommend, pros, cons, specifications } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Gemini API Key is not configured in Secrets.'
      });
    }

    const promptText = `
Please summarize the following product curation logs into a sleek, scannable bullet-point review summary:
Product Name: ${title}
Short Description: ${description}
Why Creator Recommends: ${whyIRecommend}
Pros: ${JSON.stringify(pros)}
Cons: ${JSON.stringify(cons)}
Specs: ${JSON.stringify(specifications)}

Requirements:
- Highlight **The Core Verdict** in a bold single sentence.
- List exactly **3 key pros** and **2 critical cons** from an unbiased perspective.
- Summarize who this is best suited for (the target buyer).
- Use clear, scannable markdown with professional formatting. Keep it concise.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction: 'You are an unbiased tech reviewer compiling quick summaries for busy buyers.',
        temperature: 0.2,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/summary:', error);
    res.status(500).json({ error: error.message || 'Error compiling AI review summary' });
  }
});

// Setup Vite or Static File Server based on Environment
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[On Budget Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
