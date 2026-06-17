import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    // Get all courses, check enrollment subcollection
    const coursesSnap = await adminDb.collection('courses').get();
    const enrollments = [];
    for (const doc of coursesSnap.docs) {
      const enrollment = await adminDb.collection('courses').doc(doc.id).collection('enrollments').doc(decoded.uid).get();
      if (enrollment.exists) {
        enrollments.push({ courseId: doc.id, ...enrollment.data() });
      }
    }
    return NextResponse.json({ enrollments });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
