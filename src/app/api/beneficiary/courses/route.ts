import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const orgId = userDoc.data()?.organizationId;

    let courses: any[] = [];
    if (orgId) {
      const snap = await adminDb.collection('courses').where('organizationId', '==', orgId).get();
      courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const snap = await adminDb.collection('courses').where('assignedTo', 'array-contains', uid).get();
      courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // Fetch progress for this user
    const progressSnap = await adminDb.collection('courseProgress').where('userId', '==', uid).get();
    const progressMap: Record<string, number> = {};
    progressSnap.docs.forEach(d => { progressMap[d.data().courseId] = d.data().progress || 0; });

    const coursesWithProgress = courses.map(c => ({ ...c, progress: progressMap[c.id] || 0 }));
    return NextResponse.json({ courses: coursesWithProgress });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
