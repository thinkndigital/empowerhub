import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/notifications
 * Returns the most recent 20 notifications for the authenticated user,
 * newest first.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await adminDb
      .collection('notifications')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ notifications });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Body: { ids?: string[] }
 * Marks the specified notifications as read.
 * If ids is omitted, marks ALL unread notifications for the user as read.
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json().catch(() => ({}));
    const { ids } = body as { ids?: string[] };

    let docsToMark: FirebaseFirestore.DocumentReference[] = [];

    if (ids && ids.length > 0) {
      docsToMark = ids.map((id) => adminDb.collection('notifications').doc(id));
    } else {
      // Mark all unread for this user
      const snap = await adminDb
        .collection('notifications')
        .where('userId', '==', uid)
        .where('isRead', '==', false)
        .get();
      docsToMark = snap.docs.map((d) => d.ref);
    }

    if (docsToMark.length > 0) {
      const batch = adminDb.batch();
      docsToMark.forEach((ref) => batch.update(ref, { isRead: true, readAt: FieldValue.serverTimestamp() }));
      await batch.commit();
    }

    return NextResponse.json({ updated: docsToMark.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
