import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('plans').orderBy('order').get();
  const plans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const count = (await adminDb.collection('plans').get()).size;
  const ref = adminDb.collection('plans').doc();
  await ref.set({ ...body, order: count, createdAt: new Date() });
  return NextResponse.json({ id: ref.id, ...body });
}
