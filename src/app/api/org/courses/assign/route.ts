import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    if (!orgId) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      orgId = userDoc.data()?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const { courseId, beneficiaryIds } = await req.json();
    if (!courseId || !beneficiaryIds?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // Create enrollment records for each beneficiary
    const batch = adminDb.batch();
    for (const uid of beneficiaryIds) {
      const enrollRef = adminDb.collection('courses').doc(courseId).collection('enrollments').doc(uid);
      batch.set(enrollRef, { progress: 0, enrolledAt: new Date().toISOString(), enrolledBy: decoded.uid }, { merge: true });
      // Also create courseProgress record
      const progressRef = adminDb.collection('courseProgress').doc(`${uid}_${courseId}`);
      batch.set(progressRef, { userId: uid, courseId, progress: 0, updatedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
