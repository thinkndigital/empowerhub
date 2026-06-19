import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

function normalizeDate(d: any): string | undefined {
  if (!d) return undefined;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  if (s) return new Date(s * 1000).toISOString();
  return undefined;
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await adminDb.collection('organizations').get();
  const orgs = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: normalizeDate((d.data() as any).createdAt) }));
  return NextResponse.json({ orgs });
}

export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, plan = 'free', primaryColor = '#6366f1', logoUrl = '' } = body;
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const ref = adminDb.collection('organizations').doc();
  await ref.set({ name, plan, primaryColor, logoUrl, createdAt: new Date() });
  return NextResponse.json({ id: ref.id, name, plan, primaryColor, logoUrl });
}
