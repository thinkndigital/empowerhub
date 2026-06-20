import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest, { params }: { params: { convId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { convId } = params;

    const snap = await adminDb.collection('conversations').doc(convId)
      .collection('msgs').orderBy('createdAt', 'asc').get();

    const messages = snap.docs.map(d => ({
      id: d.id,
      senderId: d.data().senderId || '',
      content: d.data().content || '',
      read: d.data().read || false,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    // Mark unread messages from the other party as read
    const batch = adminDb.batch();
    let hasUnread = false;
    snap.docs.forEach(d => {
      if (d.data().senderId !== uid && !d.data().read) {
        batch.update(d.ref, { read: true });
        hasUnread = true;
      }
    });
    if (hasUnread) await batch.commit();

    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
