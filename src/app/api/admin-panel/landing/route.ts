import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const defaultConfig = {
  heroTitle: 'منصة التمكين الرقمي',
  heroSubtitle: 'تدريب، إرشاد، وتجارة إلكترونية في مكان واحد',
  heroCtaText: 'ابدأ الآن',
  showMentors: true,
  showProducts: true,
  showTestimonials: true,
};

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await adminDb.collection('config').doc('landing').get();
  return NextResponse.json({ config: snap.exists ? { ...defaultConfig, ...snap.data() } : defaultConfig });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await adminDb.collection('config').doc('landing').set(body, { merge: true });
  return NextResponse.json({ ok: true });
}
