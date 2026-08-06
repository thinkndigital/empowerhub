import { adminDb } from '@/lib/firebase-admin';

export const SITE_URL = 'https://empowerhub.thinkndigital.com';

interface PlatformBrand {
  name: string;
  logoUrl: string;
}

let brandCache: { value: PlatformBrand; expiresAt: number } | null = null;

// Cached briefly so we don't hit Firestore on every single email send.
export async function getPlatformBrand(): Promise<PlatformBrand> {
  if (brandCache && brandCache.expiresAt > Date.now()) return brandCache.value;
  let value: PlatformBrand = { name: 'EmpowerHub', logoUrl: '' };
  try {
    const snap = await adminDb.collection('config').doc('platform').get();
    const d = snap.exists ? (snap.data() as any) : {};
    value = { name: d?.platformName || 'EmpowerHub', logoUrl: d?.logoUrl || '' };
  } catch {
    // keep default
  }
  brandCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
  return value;
}

export interface EmailLayoutOptions {
  title: string;
  bodyHtml: string;
  ctaText?: string;
  ctaLink?: string;
  brand?: PlatformBrand;
}

// RTL Arabic email layout. Email clients don't reliably load Google Fonts,
// so we stick to a system font stack instead of Cairo.
export function emailLayout({ title, bodyHtml, ctaText, ctaLink, brand }: EmailLayoutOptions): string {
  const name = brand?.name || 'EmpowerHub';
  const logoUrl = brand?.logoUrl || '';
  return `<!doctype html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Tahoma,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${name}" style="height:40px;max-width:200px;object-fit:contain;" />` : `<span style="font-size:20px;font-weight:700;color:#0f172a;">${name}</span>`}
    </div>
    <div style="background:#ffffff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;text-align:right;">${title}</h2>
      <div style="font-size:14px;line-height:1.9;color:#334155;text-align:right;">${bodyHtml}</div>
      ${ctaText && ctaLink ? `
      <div style="margin-top:24px;text-align:center;">
        <a href="${ctaLink}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">${ctaText}</a>
      </div>` : ''}
    </div>
    <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:20px;">${name} · هذه رسالة آلية، الرجاء عدم الرد عليها</p>
  </div>
</body>
</html>`;
}
