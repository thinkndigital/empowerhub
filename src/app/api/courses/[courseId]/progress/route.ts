import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const enrollDoc = await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('enrollments')
      .doc(decoded.uid)
      .get();

    if (!enrollDoc.exists) {
      return NextResponse.json({ enrolled: false, progress: 0, completedLessons: [] });
    }

    const data = enrollDoc.data()!;
    return NextResponse.json({
      enrolled: true,
      progress: data.progress ?? 0,
      completedLessons: data.completedLessons ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();

    const update: Record<string, unknown> = {
      progress: body.progress,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.completedLesson) {
      update.completedLessons = FieldValue.arrayUnion(body.completedLesson);
    }

    await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('enrollments')
      .doc(decoded.uid)
      .update(update);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
