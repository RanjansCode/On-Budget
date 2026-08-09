import { generateSitemapXml } from '../src/lib/sitemapGenerator';

export default async function handler(req: any, res: any) {
  try {
    const sitemapXml = await generateSitemapXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(sitemapXml);
  } catch (err: any) {
    console.error('Sitemap function error:', err);
    return res.status(500).send('Error generating sitemap');
  }
}
