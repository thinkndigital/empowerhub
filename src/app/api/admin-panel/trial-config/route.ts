import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('config').doc('trial').get();
  return NextResponse.json({ days: snap.exists ? (snap.data()?.days ?? 30) : 30 });
}

export async function PUT(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { days } = await req.json();
  const allowed = [7, 14, 30];
  if (!allowed.includes(Number(days))) {
    return NextResponse.json({ error: 'قيمة غير صحيحة لمدة الفترة التجريبية' }, { status: 400 });
  }
  await adminDb.collection('config').doc('trial').set({ days: Number(days) }, { merge: true });
  return NextResponse.json({ ok: true });
}
