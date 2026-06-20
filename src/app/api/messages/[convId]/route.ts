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

    // Mark unread messages from the other party as read and reset unread counter
    const batch = adminDb.batch();
    let hasUnread = false;
    snap.docs.forEach(d => {
      if (d.data().senderId !== uid && !d.data().read) {
        batch.update(d.ref, { read: true });
        hasUnread = true;
      }
    });
    if (hasUnread) {
      batch.update(adminDb.collection('conversations').doc(convId), {
        [`unread_${uid}`]: 0,
      });
      await batch.commit();
    }

    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { convId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { convId } = params;

    const { searchParams } = new URL(req.url);
    const msgId = searchParams.get('msgId');
    if (!msgId) return NextResponse.json({ error: 'msgId required' }, { status: 400 });

    const msgRef = adminDb.collection('conversations').doc(convId).collection('msgs').doc(msgId);
    const msgDoc = await msgRef.get();
    if (!msgDoc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (msgDoc.data()?.senderId !== uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    await msgRef.delete();

    // Update conversation lastMessage if this was the last message
    const lastSnap = await adminDb.collection('conversations').doc(convId)
      .collection('msgs').orderBy('createdAt', 'desc').limit(1).get();
    const lastMsg = lastSnap.empty ? '' : (lastSnap.docs[0].data().content || '');
    await adminDb.collection('conversations').doc(convId).update({ lastMessage: lastMsg });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

