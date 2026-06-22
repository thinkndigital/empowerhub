import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const defaultConfig = {
  allowCOD: true,
  codLabel: 'الدفع عند الاستلام',
  currency: 'JOD',
  moyasar: { enabled: false, publishableKey: '', secretKey: '', label: 'موياسر (Mada / Visa / STC Pay)' },
  stripe: { enabled: false, publishableKey: '', secretKey: '', label: 'Stripe (بطاقة بنكية دولية)' },
  paypal: { enabled: false, clientId: '', clientSecret: '', mode: 'sandbox', label: 'PayPal' },
  paytabs: { enabled: false, profileId: '', serverKey: '', clientKey: '', region: 'JOR', label: 'PayTabs' },
  hyperpay: { enabled: false, accessToken: '', entityIdVisa: '', entityIdMada: '', mode: 'test', label: 'HyperPay' },
  tamara: { enabled: false, apiKey: '', label: 'تمارا - اشتري الآن وادفع لاحقاً' },
  tabby: { enabled: false, apiKey: '', publicKey: '', label: 'تابي - قسّم المدفوعات' },
};

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('config').doc('payment').get();
  const data = snap.exists ? snap.data() as any : {};
  return NextResponse.json({
    config: {
      allowCOD: data.allowCOD ?? defaultConfig.allowCOD,
      codLabel: data.codLabel ?? defaultConfig.codLabel,
      currency: data.currency ?? defaultConfig.currency,
      moyasar: { ...defaultConfig.moyasar, ...(data.moyasar || {}) },
      stripe: { ...defaultConfig.stripe, ...(data.stripe || {}) },
      paypal: { ...defaultConfig.paypal, ...(data.paypal || {}) },
      paytabs: { ...defaultConfig.paytabs, ...(data.paytabs || {}) },
      hyperpay: { ...defaultConfig.hyperpay, ...(data.hyperpay || {}) },
      tamara: { ...defaultConfig.tamara, ...(data.tamara || {}) },
      tabby: { ...defaultConfig.tabby, ...(data.tabby || {}) },
    },
  });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await adminDb.collection('config').doc('payment').set(body, { merge: true });
  return NextResponse.json({ ok: true });
}
