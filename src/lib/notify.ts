import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '@/lib/mailer';
import { emailLayout, getPlatformBrand } from '@/lib/email-templates';

export interface NotifyUserInput {
  uid: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  email?: {
    subject: string;
    bodyHtml: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

// Writes the in-app notification doc (same shape every route already used)
// and, if `email` is provided, also emails the user — looked up from
// users/{uid}.email. Best-effort: an email failure never throws.
export async function notifyUser({ uid, type, title, body, link, email }: NotifyUserInput): Promise<void> {
  await adminDb.collection('notifications').add({
    userId: uid,
    type,
    title,
    body,
    link: link || '',
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (!email) return;

  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const to = userDoc.data()?.email;
    if (!to) return;
    const brand = await getPlatformBrand();
    const html = emailLayout({
      title: email.subject,
      bodyHtml: email.bodyHtml,
      ctaText: email.ctaText,
      ctaLink: email.ctaLink,
      brand,
    });
    await sendEmail({ to, subject: email.subject, html });
  } catch (e: any) {
    console.error(`[notify] failed to email uid=${uid}:`, e?.message || e);
  }
}

// For direct emails where no in-app notification / uid lookup is wanted
// (e.g. inviting someone who has no account yet).
export async function sendBrandedEmail(to: string, opts: { subject: string; bodyHtml: string; ctaText?: string; ctaLink?: string }): Promise<void> {
  const brand = await getPlatformBrand();
  const html = emailLayout({ title: opts.subject, bodyHtml: opts.bodyHtml, ctaText: opts.ctaText, ctaLink: opts.ctaLink, brand });
  await sendEmail({ to, subject: opts.subject, html });
}
