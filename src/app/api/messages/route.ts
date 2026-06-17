import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/messages
 * Returns all conversations for the authenticated user,
 * each enriched with the other participant's profile.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await adminDb
      .collection('conversations')
      .where('participants', 'array-contains', uid)
      .orderBy('lastUpdated', 'desc')
      .get();

    const conversations = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const otherUserId = (data.participants as string[]).find((p) => p !== uid);
        let otherUser: Record<string, unknown> = { id: otherUserId };
        if (otherUserId) {
          const userSnap = await adminDb.collection('users').doc(otherUserId).get();
          if (userSnap.exists) {
            otherUser = { id: userSnap.id, ...userSnap.data() };
          }
        }
        return { id: d.id, ...data, otherUser };
      })
    );

    return NextResponse.json({ conversations });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/messages
 * Body: { otherUserId: string }
 * Finds an existing conversation or creates a new one.
 * Returns the conversation id.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { otherUserId } = body as { otherUserId: string };

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 });
    }

    // Check for existing conversation between these two participants
    const existing = await adminDb
      .collection('conversations')
      .where('participants', 'array-contains', uid)
      .get();

    const existingConvo = existing.docs.find((d) => {
      const participants = d.data().participants as string[];
      return participants.includes(otherUserId);
    });

    if (existingConvo) {
      return NextResponse.json({ conversationId: existingConvo.id });
    }

    // Create new conversation
    const newConvo = await adminDb.collection('conversations').add({
      participants: [uid, otherUserId],
      lastMessage: '',
      lastUpdated: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ conversationId: newConvo.id }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
