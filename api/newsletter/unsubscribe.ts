import { processNewsletterUnsubscribe } from '../../src/lib/newsletterService';

export default async function handler(req: any, res: any) {
  try {
    const token = (req.query?.token as string) || '';
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
    console.error('Error in Vercel api/newsletter/unsubscribe:', err);
    return res.status(500).send('Internal server error processing unsubscribe request.');
  }
}
