import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

function normalizeDate(date: any): string | undefined {
  if (!date || typeof date === 'string') return date;
  if (date._seconds || date.seconds) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = decoded.organizationId as string;

    if (!orgId) {
      const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
      const orgIdFromDoc = (userSnap.data() as any)?.organizationId;
      if (!orgIdFromDoc) return NextResponse.json({ orders: [] });
    }

    const effectiveOrgId = orgId || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.organizationId;
    if (!effectiveOrgId) return NextResponse.json({ orders: [] });

    const snap = await adminDb.collection('orders').where('organizationId', '==', effectiveOrgId).get();
    const orders = snap.docs
      .map(d => ({ id: d.id, ...d.data(), createdAt: normalizeDate((d.data() as any).createdAt) }))
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({ orders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
