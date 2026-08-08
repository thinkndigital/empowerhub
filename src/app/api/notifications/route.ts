import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Firestore's Admin SDK normally returns a real Timestamp (with .toDate()),
// but documents written by other paths (or read back after serialization)
// can carry a plain { _seconds, _nanoseconds } object instead. Falling back
// to "now" when neither shape matches would make every such notification
// permanently display as "just now" — return '' instead so the client can
// simply omit the time rather than show a wrong one.
function normalizeDate(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (typeof date.toDate === 'function') {
    try { return date.toDate().toISOString(); } catch { /* fall through */ }
  }
  const seconds = date._seconds ?? date.seconds;
  if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
  return '';
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', uid)
      .get();

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || '',
        title: data.title || '',
        body: data.body || '',
        read: data.read || false,
        createdAt: normalizeDate(data.createdAt),
        link: data.link || '',
      };
    })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();

    if (body.all) {
      const snapshot = await adminDb
        .collection('notifications')
        .where('userId', '==', uid)
        .where('read', '==', false)
        .get();
      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } else if (body.id) {
      await adminDb.collection('notifications').doc(body.id).update({ read: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
