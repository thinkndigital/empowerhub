import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('conversations')
      .where('participants', 'array-contains', decoded.uid)
      .orderBy('updatedAt', 'desc').get();
    const conversations = await Promise.all(snap.docs.map(async d => {
      const data = d.data();
      const otherId = data.participants.find((p: string) => p !== decoded.uid);
      let otherUser = { id: otherId, name: 'مستخدم', role: '' };
      if (otherId) {
        const u = await adminDb.collection('users').doc(otherId).get();
        if (u.exists) otherUser = { id: otherId, name: u.data()?.name || 'مستخدم', role: u.data()?.role || '' };
      }
      return { id: d.id, ...data, otherUser };
    }));
    return NextResponse.json({ conversations });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const { toUserId, content } = await req.json();
    const participants = [decoded.uid, toUserId].sort();
    const convQuery = await adminDb.collection('conversations')
      .where('participants', '==', participants).limit(1).get();
    let convId: string;
    if (convQuery.empty) {
      const ref = await adminDb.collection('conversations').add({
        participants, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), lastMessage: content,
      });
      convId = ref.id;
    } else {
      convId = convQuery.docs[0].id;
      await adminDb.collection('conversations').doc(convId).update({ updatedAt: FieldValue.serverTimestamp(), lastMessage: content });
    }
    const msgRef = await adminDb.collection('conversations').doc(convId).collection('msgs').add({
      senderId: decoded.uid, content, createdAt: FieldValue.serverTimestamp(),
    });
    // Create notification for recipient
    await adminDb.collection('notifications').add({
      userId: toUserId, type: 'message', title: 'رسالة جديدة',
      body: content.slice(0, 80), link: '/messages', read: false, createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ conversationId: convId, messageId: msgRef.id });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
