import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';

interface EmailConfig {
  apiKey: string;
  fromName: string;
  fromAddress: string;
}

let configCache: { value: EmailConfig; expiresAt: number } | null = null;

// Admin-configured Resend key/sender (config/email doc) take priority over
// env vars, but env vars still work as a fallback for local dev / before an
// admin has set anything in the UI. Cached briefly to avoid a Firestore read
// on every single email send.
async function getEmailConfig(): Promise<EmailConfig> {
  if (configCache && configCache.expiresAt > Date.now()) return configCache.value;
  let apiKey = process.env.RESEND_API_KEY || '';
  let fromName = 'EmpowerHub';
  let fromAddress = '';
  try {
    const snap = await adminDb.collection('config').doc('email').get();
    const d = snap.exists ? (snap.data() as any) : {};
    if (d?.resendApiKey) apiKey = d.resendApiKey;
    if (d?.fromName) fromName = d.fromName;
    if (d?.fromAddress) fromAddress = d.fromAddress;
  } catch {
    // keep env-based defaults
  }
  const value = { apiKey, fromName, fromAddress };
  configCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
  return value;
}

let client: Resend | null = null;
let clientKey: string | null = null;
function getClient(apiKey: string): Resend | null {
  if (!apiKey) return null;
  if (!client || clientKey !== apiKey) {
    client = new Resend(apiKey);
    clientKey = apiKey;
  }
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromNameOverride?: string;
}

// Best-effort: never throws. If no Resend key is configured (env or admin
// settings), logs and no-ops instead of breaking the API route that
// triggered it.
export async function sendEmail({ to, subject, html, replyTo, fromNameOverride }: SendEmailInput): Promise<void> {
  const { apiKey, fromName, fromAddress } = await getEmailConfig();
  const resend = getClient(apiKey);
  const displayName = fromNameOverride || fromName;
  const from = fromAddress
    ? `${displayName} <${fromAddress}>`
    : process.env.EMAIL_FROM || 'EmpowerHub <notifications@empowerhub.thinkndigital.com>';
  if (!resend) {
    console.warn(`[mailer] no Resend API key configured — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from, to, subject, html, ...(replyTo ? { replyTo } : {}) });
  } catch (e: any) {
    console.error(`[mailer] failed to send email to ${to}:`, e?.message || e);
  }
}
