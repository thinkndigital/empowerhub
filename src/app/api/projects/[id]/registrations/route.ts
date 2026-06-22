import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    if (userData.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const orgId = userData.organizationId || (decoded as any).organizationId || '';
    const projDoc = await adminDb.collection('projects').doc(params.id).get();
    if (!projDoc.exists || projDoc.data()?.organizationId !== orgId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const snap = await adminDb.collection('projects').doc(params.id).collection('registrations').get();
    const registrations = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      submittedAt: normalizeDate(d.data().submittedAt),
    }));
    registrations.sort((a: any, b: any) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    return NextResponse.json({ registrations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
