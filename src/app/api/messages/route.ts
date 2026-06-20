import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'مستفيد',
  mentor: 'مرشد',
  coach: 'مدرب',
  organization: 'مدير جهة',
  admin: 'مشرف',
};

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await adminDb.collection('conversations')
      .where('participants', 'array-contains', uid)
      .orderBy('lastUpdated', 'desc').get();

    const conversations = await Promise.all(snap.docs.map(async d => {
      const data = d.data();
      const otherId = data.participants.find((p: string) => p !== uid);
      let otherUser = { id: otherId || '', name: 'مستخدم', role: '' };
      if (otherId) {
        const u = await adminDb.collection('users').doc(otherId).get();
        if (u.exists) {
          otherUser = {
            id: otherId,
            name: u.data()?.name || 'مستخدم',
            role: u.data()?.role || '',
          };
        }
      }

      // Count unread messages (messages not sent by current user without a read receipt)
      const unreadSnap = await adminDb.collection('conversations').doc(d.id)
        .collection('msgs')
        .where('senderId', '!=', uid)
        .where('read', '==', false)
        .get();

      return {
        id: d.id,
        participants: data.participants || [],
        lastMessage: data.lastMessage || '',
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || null,
        unreadCount: unreadSnap.size,
        otherUser,
      };
    }));

    return NextResponse.json({ conversations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { toUserId, content } = await req.json();
    if (!toUserId) return NextResponse.json({ error: 'toUserId is required' }, { status: 400 });

    const participants = [uid, toUserId].sort();

    // Find or create conversation
    const convQuery = await adminDb.collection('conversations')
      .where('participants', '==', participants).limit(1).get();

    let convId: string;
    if (convQuery.empty) {
      const ref = await adminDb.collection('conversations').add({
        participants,
        createdAt: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
        lastMessage: content || '',
      });
      convId = ref.id;
    } else {
      convId = convQuery.docs[0].id;
      if (content) {
        await adminDb.collection('conversations').doc(convId).update({
          lastUpdated: FieldValue.serverTimestamp(),
          lastMessage: content,
        });
      }
    }

    let messageId = '';
    if (content && content.trim()) {
      // Get sender name for notification
      const senderDoc = await adminDb.collection('users').doc(uid).get();
      const senderName = senderDoc.data()?.name || 'مستخدم';

      const msgRef = await adminDb.collection('conversations').doc(convId).collection('msgs').add({
        senderId: uid,
        content: content.trim(),
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      messageId = msgRef.id;

      // Create notification for recipient
      await adminDb.collection('notifications').add({
        userId: toUserId,
        type: 'message',
        title: `رسالة جديدة من ${senderName}`,
        body: content.slice(0, 100),
        link: '/messages',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ conversationId: convId, messageId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
