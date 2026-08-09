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
import { generateSitemapXml } from './src/lib/sitemapGenerator';
import { processNewsletterSubscription, processNewsletterUnsubscribe } from './src/lib/newsletterService';

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
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://inourbudget.vercel.app/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(robotsTxt);
});

// 2. AUTOMATIC DYNAMIC SITEMAP.XML
app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemapXml = await generateSitemapXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(sitemapXml);
  } catch (err: any) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// 3. NEWSLETTER SUBSCRIBE & UNSUBSCRIBE API
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email, source } = req.body || {};
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';

    const result = await processNewsletterSubscription(email, source || 'website_footer', clientIp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        isDuplicate: result.isDuplicate || false,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      emailSent: result.emailSent || false,
    });
  } catch (err: any) {
    console.error('Error in /api/newsletter/subscribe:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing subscription. Please try again later.',
    });
  }
});

app.get('/api/newsletter/unsubscribe', async (req, res) => {
  try {
    const token = req.query.token as string;
    const result = await processNewsletterUnsubscribe(token);

    const htmlResponse = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Unsubscribe - In Our Budget</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #1E293B; border: 1px solid #334155; border-radius: 20px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .logo { color: #FF5A00; font-weight: 800; font-size: 24px; margin-bottom: 24px; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
    .desc { font-size: 14px; color: #94A3B8; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-block; background: #FF5A00; color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; transition: background 0.2s; }
    .btn:hover { background: #E04F00; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">In Our Budget.</div>
    <div class="title">${result.success ? 'Unsubscribed Successfully' : 'Unsubscribe Request'}</div>
    <div class="desc">${result.message}</div>
    <a href="/" class="btn">Return to In Our Budget</a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlResponse);
  } catch (err: any) {
    console.error('Error in /api/newsletter/unsubscribe:', err);
    return res.status(500).send('Internal server error processing unsubscribe request.');
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
