import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await adminDb.collection('conversations')
      .where('participants', 'array-contains', uid)
      .get();

    const conversations = (await Promise.all(snap.docs.map(async d => {
      const data = d.data();
      const otherId = data.participants.find((p: string) => p !== uid);
      let otherUser = { id: otherId || '', name: 'مستخدم', role: '' };
      if (otherId) {
        const u = await adminDb.collection('users').doc(otherId).get();
        if (u.exists) {
          otherUser = { id: otherId, name: u.data()?.name || 'مستخدم', role: u.data()?.role || '' };
        }
      }
      // unreadCount stored directly on conversation doc as unread_{uid}
      const unreadCount = data[`unread_${uid}`] || 0;
      return {
        id: d.id,
        participants: data.participants || [],
        lastMessage: data.lastMessage || '',
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || null,
        unreadCount,
        otherUser,
      };
    }))).sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));

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

    // Check if recipient has blocked sender
    const recipientDoc = await adminDb.collection('users').doc(toUserId).get();
    const recipientBlocked: string[] = recipientDoc.data()?.blockedUsers || [];
    if (recipientBlocked.includes(uid)) {
      return NextResponse.json({ error: 'تعذر إرسال الرسالة' }, { status: 403 });
    }

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
        lastMessage: '',
        [`unread_${uid}`]: 0,
        [`unread_${toUserId}`]: 0,
      });
      convId = ref.id;
    } else {
      convId = convQuery.docs[0].id;
    }

    let messageId = '';
    const text = content?.trim() || '';
    if (text) {
      // Get sender name
      const senderDoc = await adminDb.collection('users').doc(uid).get();
      const senderName = senderDoc.data()?.name || 'مستخدم';

      const msgRef = await adminDb.collection('conversations').doc(convId).collection('msgs').add({
        senderId: uid,
        content: text,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      messageId = msgRef.id;

      // Update conversation: last message + increment unread for recipient
      await adminDb.collection('conversations').doc(convId).update({
        lastMessage: text,
        lastUpdated: FieldValue.serverTimestamp(),
        [`unread_${toUserId}`]: FieldValue.increment(1),
      });

      // Notify recipient
      await notifyUser({
        uid: toUserId,
        type: 'message',
        title: `رسالة جديدة من ${senderName}`,
        body: text.slice(0, 100),
        link: '/messages',
        email: {
          subject: `رسالة جديدة من ${senderName}`,
          bodyHtml: text.slice(0, 300),
          ctaText: 'الرد على الرسالة',
          ctaLink: `${SITE_URL}/messages`,
        },
      });
    }

    return NextResponse.json({ conversationId: convId, messageId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
