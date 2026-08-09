import { processNewsletterSubscription } from '../../src/lib/newsletterService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, source } = req.body || {};
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || '127.0.0.1';

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
    console.error('Error in Vercel api/newsletter/subscribe:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing subscription.',
    });
  }
}
