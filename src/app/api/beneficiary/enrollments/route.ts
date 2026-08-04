import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Get all courses in parallel, check enrollment subcollection for this user
    const coursesSnap = await adminDb.collection('courses').get();
    const results = await Promise.all(
      coursesSnap.docs.map(async (courseDoc) => {
        const enrollDoc = await adminDb
          .collection('courses').doc(courseDoc.id)
          .collection('enrollments').doc(uid).get();
        if (!enrollDoc.exists) return null;
        const data = enrollDoc.data()!;
        // Normalize enrolledAt timestamp
        let enrolledAt = data.enrolledAt;
        if (enrolledAt && typeof enrolledAt === 'object' && (enrolledAt._seconds || enrolledAt.seconds)) {
          enrolledAt = new Date((enrolledAt._seconds ?? enrolledAt.seconds) * 1000).toISOString();
        }
        return {
          courseId: courseDoc.id,
          title: courseDoc.data()?.title || '',
          progress: data.progress ?? 0,
          enrolledAt: enrolledAt || null,
        };
      })
    );

    const enrollments = results.filter(Boolean);
    return NextResponse.json({ enrollments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
