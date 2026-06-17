import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();

    let beneficiaryId = decoded.uid;

    if (body.beneficiaryId && body.beneficiaryId !== decoded.uid) {
      // Only coaches or orgs can enroll other users
      const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
      const callerRole = callerDoc.data()?.role;
      if (callerRole !== 'coach' && callerRole !== 'organization') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      beneficiaryId = body.beneficiaryId;
    }

    // Get course title for notification
    const courseDoc = await adminDb.collection('courses').doc(params.courseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const courseTitle = courseDoc.data()?.title || 'الدورة';

    // Create enrollment
    await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('enrollments')
      .doc(beneficiaryId)
      .set({
        userId: beneficiaryId,
        enrolledAt: FieldValue.serverTimestamp(),
        progress: 0,
        completedLessons: [],
      });

    // Update enrolledCount on course doc
    await adminDb.collection('courses').doc(params.courseId).update({
      enrolledCount: FieldValue.increment(1),
    });

    // Create notification for beneficiary
    await adminDb.collection('notifications').add({
      userId: beneficiaryId,
      type: 'course_enrollment',
      title: 'تسجيل في دورة جديدة',
      body: `تم تسجيلك في دورة ${courseTitle}`,
      link: '/beneficiary-dashboard/courses',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();

    let beneficiaryId = decoded.uid;

    if (body.beneficiaryId && body.beneficiaryId !== decoded.uid) {
      const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
      const callerRole = callerDoc.data()?.role;
      if (callerRole !== 'coach' && callerRole !== 'organization') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      beneficiaryId = body.beneficiaryId;
    }

    await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('enrollments')
      .doc(beneficiaryId)
      .delete();

    await adminDb.collection('courses').doc(params.courseId).update({
      enrolledCount: FieldValue.increment(-1),
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
