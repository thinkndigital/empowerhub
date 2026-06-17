import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: { convId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('conversations').doc(params.convId)
      .collection('msgs').orderBy('createdAt', 'asc').get();
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString() }));
    return NextResponse.json({ messages });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
