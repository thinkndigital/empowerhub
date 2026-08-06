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

// Maps a notification `type` to the coarse category an org can toggle on its
// settings page. Types not listed here (welcome, org_removal, subscription_*)
// are account/system-critical and always send regardless of org preference.
const CATEGORY_BY_TYPE: Record<string, string> = {
  message: 'messages',
  course_enrollment: 'courses',
  course_enrolled: 'courses',
  session_invite: 'sessions',
  session_created: 'sessions',
  org_invitation: 'membership',
  content_offer: 'membership',
  assignment: 'membership',
  assessment: 'assessments',
};

interface OrgEmailSettings {
  replyTo?: string;
  senderName?: string;
  prefs: Record<string, boolean>;
}

const orgSettingsCache = new Map<string, { value: OrgEmailSettings; expiresAt: number }>();

async function getOrgEmailSettings(orgId: string): Promise<OrgEmailSettings> {
  const cached = orgSettingsCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  let value: OrgEmailSettings = { prefs: {} };
  try {
    const snap = await adminDb.collection('organizations').doc(orgId).get();
    const d = snap.data() as any;
    value = {
      replyTo: d?.emailReplyTo || undefined,
      senderName: d?.emailSenderName || undefined,
      prefs: d?.emailNotificationPrefs || {},
    };
  } catch {
    // keep defaults (no overrides, nothing disabled)
  }
  orgSettingsCache.set(orgId, { value, expiresAt: Date.now() + 60 * 1000 });
  return value;
}

// Writes the in-app notification doc (same shape every route already used)
// and, if `email` is provided, also emails the user — looked up from
// users/{uid}.email. Respects the user's organization's email preferences
// (a category the org turned off, e.g. "sessions", skips the email but the
// in-app notification is still created) and applies the org's reply-to /
// sender-name overrides when configured. Best-effort: an email failure
// never throws.
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
    const userData = userDoc.data();
    const to = userData?.email;
    if (!to) return;

    const orgId: string | undefined = userData?.organizationId;
    let orgSettings: OrgEmailSettings | null = null;
    if (orgId) {
      orgSettings = await getOrgEmailSettings(orgId);
      const category = CATEGORY_BY_TYPE[type];
      if (category && orgSettings.prefs[category] === false) return;
    }

    const brand = await getPlatformBrand();
    const html = emailLayout({
      title: email.subject,
      bodyHtml: email.bodyHtml,
      ctaText: email.ctaText,
      ctaLink: email.ctaLink,
      brand,
    });
    await sendEmail({
      to,
      subject: email.subject,
      html,
      replyTo: orgSettings?.replyTo,
      fromNameOverride: orgSettings?.senderName,
    });
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
