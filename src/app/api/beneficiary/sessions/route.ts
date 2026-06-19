import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('sessions')
      .where('attendees', 'array-contains', decoded.uid)
      .get();
    const sessions = snap.docs
      .map(d => {
        const data = d.data();
        // Normalize Firestore Timestamp to ISO string
        let date = data.date;
        if (date && typeof date === 'object' && (date._seconds || date.seconds)) {
          date = new Date((date._seconds ?? date.seconds) * 1000).toISOString();
        }
        return { id: d.id, ...data, date };
      })
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
