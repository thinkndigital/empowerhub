import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snapshot = await adminDb
      .collection('messages')
      .where('participants', 'array-contains', uid)
      .orderBy('updatedAt', 'desc')
      .get();

    const conversations = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherUserId = (data.participants as string[]).find((p: string) => p !== uid) || '';
        let otherUser = { id: otherUserId, name: 'مستخدم', role: '' };
        if (otherUserId) {
          const userDoc = await adminDb.collection('users').doc(otherUserId).get();
          if (userDoc.exists) {
            const userData = userDoc.data()!;
            otherUser = { id: otherUserId, name: userData.name || userData.displayName || 'مستخدم', role: userData.role || '' };
          }
        }
        return {
          id: doc.id,
          participants: data.participants,
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          unreadCount: data.unreadCount?.[uid] || 0,
          otherUser,
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { toUserId, content } = await req.json();
    if (!toUserId || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Find existing conversation
    const snapshot = await adminDb
      .collection('messages')
      .where('participants', 'array-contains', uid)
      .get();

    let convId: string | null = null;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if ((data.participants as string[]).includes(toUserId)) {
        convId = doc.id;
        break;
      }
    }

    const now = FieldValue.serverTimestamp();

    if (!convId) {
      // Create new conversation
      const convRef = await adminDb.collection('messages').add({
        participants: [uid, toUserId],
        lastMessage: content,
        updatedAt: now,
        unreadCount: { [toUserId]: 1, [uid]: 0 },
      });
      convId = convRef.id;
    } else {
      // Update existing
      await adminDb.collection('messages').doc(convId).update({
        lastMessage: content,
        updatedAt: now,
        [`unreadCount.${toUserId}`]: FieldValue.increment(1),
      });
    }

    // Add message to subcollection
    const msgRef = await adminDb.collection('messages').doc(convId).collection('msgs').add({
      senderId: uid,
      content,
      createdAt: now,
    });

    return NextResponse.json({ conversationId: convId, messageId: msgRef.id });
  } catch (error) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
