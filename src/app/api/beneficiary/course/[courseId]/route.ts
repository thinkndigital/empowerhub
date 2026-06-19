import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const [courseDoc, progressDoc] = await Promise.all([
      adminDb.collection('courses').doc(params.courseId).get(),
      adminDb.collection('courseProgress').doc(`${uid}_${params.courseId}`).get(),
    ]);

    if (!courseDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch lessons subcollection if exists
    const lessonsSnap = await adminDb.collection('courses').doc(params.courseId).collection('lessons').orderBy('order').get().catch(() => null);
    const lessons = lessonsSnap ? lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [];

    const course = { id: courseDoc.id, ...courseDoc.data() };
    const progress = progressDoc.exists ? (progressDoc.data()?.progress || 0) : 0;

    return NextResponse.json({ course, progress, lessons });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { progress } = await req.json();

    const progressRef = adminDb.collection('courseProgress').doc(`${uid}_${params.courseId}`);
    await progressRef.set({ userId: uid, courseId: params.courseId, progress, updatedAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
