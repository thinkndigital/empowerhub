import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    // Sessions where the beneficiary is an attendee
    const snap = await adminDb.collection('sessions')
      .where('attendees', 'array-contains', decoded.uid)
      .orderBy('date', 'desc')
      .get();
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
