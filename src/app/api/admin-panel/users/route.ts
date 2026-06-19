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

export async function GET(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const role = searchParams.get('role');

  let query: FirebaseFirestore.Query = adminDb.collection('users');
  if (orgId) query = query.where('organizationId', '==', orgId);
  if (role) query = query.where('role', '==', role);

  const snap = await query.get();
  const users = snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, name: data.name, email: data.email, role: data.role, organizationId: data.organizationId, status: data.status, avatarUrl: data.avatarUrl, createdAt: normalizeDate(data.createdAt) };
  });

  return NextResponse.json({ users });
}
