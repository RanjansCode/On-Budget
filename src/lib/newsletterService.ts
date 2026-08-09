import { Resend } from 'resend';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import crypto from 'crypto';

// Basic in-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map<string, number[]>();

export function isRateLimited(ip: string, maxRequests = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= maxRequests) {
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

export function generateSecureToken(): string {
  try {
    return crypto.randomBytes(24).toString('hex');
  } catch (e) {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

export interface SubscribeResult {
  success: boolean;
  message: string;
  emailSent?: boolean;
  isDuplicate?: boolean;
}

export async function processNewsletterSubscription(
  rawEmail: string,
  source = 'website_footer',
  userIp = '127.0.0.1'
): Promise<SubscribeResult> {
  // 1. Validation & Normalization
  if (!rawEmail) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const trimmedEmail = rawEmail.trim();
  const normalizedEmail = trimmedEmail.toLowerCase();

  if (!validateEmail(normalizedEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  // 2. Anti-spam Rate Limiting
  if (isRateLimited(userIp)) {
    return { success: false, message: 'Too many subscription attempts. Please try again later.' };
  }

  const domain = process.env.APP_URL || 'https://inourbudget.vercel.app';
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.NEWSLETTER_ADMIN_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'In Our Budget <onboarding@resend.dev>';

  let docId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let unsubscribeToken = generateSecureToken();
  let existingDocRef: any = null;
  let isReactivation = false;

  // 3. Database Check for Duplicates in Firestore
  if (isFirebaseConfigured) {
    try {
      const subsRef = collection(db, 'newsletterSubscribers');
      const q = query(subsRef, where('normalizedEmail', '==', normalizedEmail));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        const data = existingDoc.data();

        if (data.status === 'active') {
          return {
            success: false,
            isDuplicate: true,
            message: 'This email is already subscribed.',
          };
        } else {
          // Previously unsubscribed -> reactivate
          isReactivation = true;
          docId = existingDoc.id;
          existingDocRef = doc(db, 'newsletterSubscribers', docId);
          unsubscribeToken = data.unsubscribeToken || unsubscribeToken;
        }
      }
    } catch (err) {
      console.warn('[Newsletter] Firestore duplicate query error:', err);
    }
  }

  const nowIso = new Date().toISOString();

  // 4. Store/Update Document in Firestore
  if (isFirebaseConfigured) {
    try {
      const docRef = existingDocRef || doc(db, 'newsletterSubscribers', docId);
      const payload = {
        email: trimmedEmail,
        normalizedEmail,
        subscribedAt: nowIso,
        status: 'active',
        source,
        confirmationStatus: 'confirmed',
        unsubscribeToken,
        updatedAt: nowIso,
      };

      if (isReactivation) {
        await updateDoc(docRef, payload);
      } else {
        await setDoc(docRef, payload);
      }
    } catch (err) {
      console.error('[Newsletter] Firestore save error:', err);
      // We still attempt to deliver email or notify if needed
    }
  }

  // 5. Real Email Delivery via Resend
  let emailSent = false;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const unsubscribeUrl = `${domain}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

      // A. Send Confirmation / Welcome Email to Subscriber
      const welcomeSubject = 'Welcome to In Our Budget 🚀';
      const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to In Our Budget</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    
    <!-- Header Banner -->
    <div style="background-color: #1E293B; padding: 28px 32px; text-align: left; border-bottom: 3px solid #FF5A00;">
      <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
        In Our Budget <span style="color: #FF5A00;">.</span>
      </h1>
      <p style="color: #94A3B8; font-size: 13px; margin: 6px 0 0 0;">
        Personally Tested & Crated Budget Curations
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px; line-height: 1.6;">
      <h2 style="font-size: 18px; color: #0F172A; margin-top: 0; font-weight: 700;">Hi there! 👋</h2>
      <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
        Welcome to <strong>In Our Budget</strong>! You’re now subscribed to receive our hand-picked, personally tested gadget discoveries and deal drops.
      </p>

      <div style="background-color: #FFF7ED; border-left: 4px solid #FF5A00; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
        <p style="font-size: 13px; font-weight: 700; color: #9A3412; margin: 0 0 8px 0;">What you'll be getting:</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #431407;">
          <li style="margin-bottom: 4px;">🔥 New product discoveries &amp; viral gadget spot-checks</li>
          <li style="margin-bottom: 4px;">⭐ Personally tested electronics &amp; desk setup reviews</li>
          <li style="margin-bottom: 4px;">🏷️ Exclusive budget-friendly deals &amp; coupon alerts</li>
          <li style="margin-bottom: 4px;">📉 Price drops under ₹199, ₹499 &amp; ₹999</li>
          <li style="margin-bottom: 0;">🎯 Tailored recommendations for students &amp; setup creators</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
        We respect your inbox and promise strictly no spam. Only high-value drops when great deals or reviews go live.
      </p>

      <div style="border-top: 1px solid #E2E8F0; pt-20; padding-top: 20px;">
        <p style="font-size: 13px; color: #64748B; margin: 0;">
          Regards,<br>
          <strong style="color: #0F172A;">In Our Budget Curation Team</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #F1F5F9; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p style="font-size: 11px; color: #64748B; margin: 0 0 8px 0;">
        © ${new Date().getFullYear()} In Our Budget. All rights reserved.
      </p>
      <p style="font-size: 11px; margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #64748B; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    </div>

  </div>
</body>
</html>
`;

      const sendResult = await resend.emails.send({
        from: fromEmail,
        to: [trimmedEmail],
        subject: welcomeSubject,
        html: welcomeHtml,
      });

      if (sendResult.data && !sendResult.error) {
        emailSent = true;
      } else {
        console.warn('[Newsletter] Resend welcome email warning:', sendResult.error);
      }

      // B. Send Admin Notification Email if NEWSLETTER_ADMIN_EMAIL is set
      if (adminEmail) {
        const adminSubject = 'New In Our Budget Newsletter Subscriber 📩';
        const adminHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #1E293B;">
            <h2 style="color: #FF5A00;">New Subscriber Notification</h2>
            <p>A new user has subscribed to the <strong>In Our Budget</strong> newsletter!</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; border: 1px solid #CBD5E1; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #CBD5E1;">${trimmedEmail}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #CBD5E1; font-weight: bold;">Normalized Email</td><td style="padding: 8px; border: 1px solid #CBD5E1;">${normalizedEmail}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #CBD5E1; font-weight: bold;">Source</td><td style="padding: 8px; border: 1px solid #CBD5E1;">${source}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #CBD5E1; font-weight: bold;">Subscribed At</td><td style="padding: 8px; border: 1px solid #CBD5E1;">${new Date().toLocaleString()}</td></tr>
            </table>
          </div>
        `;

        await resend.emails.send({
          from: fromEmail,
          to: [adminEmail],
          subject: adminSubject,
          html: adminHtml,
        }).catch(err => console.warn('[Newsletter] Admin notification email error:', err));
      }
    } catch (err) {
      console.error('[Newsletter] Resend execution error:', err);
    }
  } else {
    console.warn('[Newsletter] RESEND_API_KEY environment variable is missing. Welcome email skipped.');
  }

  return {
    success: true,
    emailSent,
    message: "You're subscribed! Check your inbox for a confirmation email.",
  };
}

export async function processNewsletterUnsubscribe(token: string): Promise<{ success: boolean; message: string; email?: string }> {
  if (!token || typeof token !== 'string') {
    return { success: false, message: 'Invalid or missing unsubscribe token.' };
  }

  const cleanToken = token.trim();

  if (isFirebaseConfigured) {
    try {
      const subsRef = collection(db, 'newsletterSubscribers');
      const q = query(subsRef, where('unsubscribeToken', '==', cleanToken));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const targetDoc = snapshot.docs[0];
        const targetData = targetDoc.data();

        await updateDoc(doc(db, 'newsletterSubscribers', targetDoc.id), {
          status: 'unsubscribed',
          unsubscribedAt: new Date().toISOString(),
        });

        return {
          success: true,
          email: targetData.email,
          message: 'You have been unsubscribed from In Our Budget emails.',
        };
      }
    } catch (err) {
      console.error('[Newsletter] Unsubscribe firestore error:', err);
    }
  }

  return {
    success: false,
    message: 'Invalid or expired unsubscribe link.',
  };
}
