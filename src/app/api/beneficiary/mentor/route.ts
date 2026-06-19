import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const mentorId = userDoc.data()?.mentorId;

    if (!mentorId) return NextResponse.json({ mentor: null });

    const mentorDoc = await adminDb.collection('users').doc(mentorId).get();
    if (!mentorDoc.exists) return NextResponse.json({ mentor: null });

    return NextResponse.json({ mentor: { id: mentorDoc.id, ...mentorDoc.data() } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
