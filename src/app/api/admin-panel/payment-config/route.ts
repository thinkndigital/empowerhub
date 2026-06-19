import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const defaultConfig = {
  enabled: false,
  provider: 'moyasar',
  moyasarPublishableKey: '',
  moyasarSecretKey: '',
  currency: 'SAR',
  allowCOD: true,
  codLabel: 'الدفع عند الاستلام',
  onlineLabel: 'الدفع الإلكتروني (بطاقة بنكية)',
};

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('config').doc('payment').get();
  const data = snap.exists ? snap.data() : {};
  return NextResponse.json({ config: { ...defaultConfig, ...data } });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await adminDb.collection('config').doc('payment').set(body, { merge: true });
  return NextResponse.json({ ok: true });
}
