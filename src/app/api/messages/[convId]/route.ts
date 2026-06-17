import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { convId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { convId } = params;

    const snapshot = await adminDb
      .collection('messages')
      .doc(convId)
      .collection('msgs')
      .orderBy('createdAt', 'asc')
      .get();

    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        content: data.content,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      };
    });

    // Mark as read
    await adminDb.collection('messages').doc(convId).update({
      [`unreadCount.${uid}`]: 0,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/messages/[convId] error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
