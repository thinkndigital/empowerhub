import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

function normalizeDate(date: any): string | undefined {
  if (!date || typeof date === 'string') return date;
  if (date._seconds || date.seconds) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
}

async function getOrgId(uid: string, tokenOrgId?: string) {
  if (tokenOrgId) return tokenOrgId;
  const userSnap = await adminDb.collection('users').doc(uid).get();
  return userSnap.data()?.organizationId as string | undefined;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded.uid, decoded.organizationId as string | undefined);
    if (!orgId) return NextResponse.json({ requests: [] });

    const snap = await adminDb.collection('contactRequests').where('organizationId', '==', orgId).get();
    const requests = snap.docs
      .map(d => ({ id: d.id, ...d.data(), createdAt: normalizeDate((d.data() as any).createdAt) }))
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({ requests });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded.uid, decoded.organizationId as string | undefined);
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const { id, status } = await req.json();
    if (!id || !['pending', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const docSnap = await adminDb.collection('contactRequests').doc(id).get();
    if (!docSnap.exists || docSnap.data()?.organizationId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('contactRequests').doc(id).update({ status });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
