import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || '',
        title: data.title || '',
        body: data.body || '',
        read: data.read || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        link: data.link || '',
      };
    });

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
