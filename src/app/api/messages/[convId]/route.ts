import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/messages/[convId]
 * Returns all messages in a conversation, oldest first.
 * The caller must be a participant in the conversation.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { convId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { convId } = params;

    // Verify the user is a participant
    const convoSnap = await adminDb.collection('conversations').doc(convId).get();
    if (!convoSnap.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    const participants = convoSnap.data()?.participants as string[];
    if (!participants.includes(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messagesSnap = await adminDb
      .collection('conversations')
      .doc(convId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const messages = messagesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ messages });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/messages/[convId]
 * Body: { text: string }
 * Sends a message in the conversation, updates lastMessage on the conversation doc,
 * and creates a notification for the other participant.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { convId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { convId } = params;

    const body = await req.json();
    const { text } = body as { text: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Verify the user is a participant
    const convoRef = adminDb.collection('conversations').doc(convId);
    const convoSnap = await convoRef.get();
    if (!convoSnap.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    const participants = convoSnap.data()?.participants as string[];
    if (!participants.includes(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Write the message
    const messageRef = await convoRef.collection('messages').add({
      senderId: uid,
      text,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Update the conversation's lastMessage
    await convoRef.update({
      lastMessage: text,
      lastUpdated: FieldValue.serverTimestamp(),
    });

    // Send a notification to the other participant
    const otherUserId = participants.find((p) => p !== uid);
    if (otherUserId) {
      const senderSnap = await adminDb.collection('users').doc(uid).get();
      const senderName: string = senderSnap.exists
        ? (senderSnap.data()?.name as string) || 'مستخدم'
        : 'مستخدم';

      await adminDb.collection('notifications').add({
        userId: otherUserId,
        title: `رسالة جديدة من ${senderName}`,
        description: text.slice(0, 100),
        link: `/messages`,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ messageId: messageRef.id }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
