import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = decoded.organizationId as string;
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const snap = await adminDb.collection('courses').where('organizationId', '==', orgId).get();
    const courses = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    return NextResponse.json({ courses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
