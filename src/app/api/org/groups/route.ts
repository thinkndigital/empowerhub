import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = decoded.organizationId as string;
    if (!orgId) return NextResponse.json({ groups: [] });

    const snap = await adminDb.collection('groups').where('orgId', '==', orgId).get();
    const groups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ groups });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
