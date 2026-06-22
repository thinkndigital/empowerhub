import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    if (userData.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const docRef = adminDb.collection('live_sessions').doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.coachId !== decoded.uid) {
      return NextResponse.json({ error: 'غير موجود أو غير مصرح' }, { status: 404 });
    }

    const body = await req.json();
    const update: Record<string, any> = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.coverImageUrl !== undefined) update.coverImageUrl = body.coverImageUrl;
    if (body.date !== undefined) update.date = new Date(body.date);
    if (body.duration !== undefined) update.duration = Number(body.duration);
    if (body.meetLink !== undefined) update.meetLink = body.meetLink;
    if (body.price !== undefined) update.price = Number(body.price);
    if (body.maxParticipants !== undefined) update.maxParticipants = body.maxParticipants ? Number(body.maxParticipants) : null;
    if (body.status !== undefined) update.status = body.status;

    await docRef.update(update);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    if (userData.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const docRef = adminDb.collection('live_sessions').doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.coachId !== decoded.uid) {
      return NextResponse.json({ error: 'غير موجود أو غير مصرح' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
