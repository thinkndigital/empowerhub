import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Get user doc for org + enrolled courses
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const orgId = userData.organizationId || (decoded.organizationId as string | undefined);
    const enrolledCourseIds: string[] = userData.enrolledCourses || [];

    const courseMap = new Map<string, any>();

    // 1. Org-assigned courses
    if (orgId) {
      const snap = await adminDb.collection('courses').where('organizationId', '==', orgId).get();
      snap.docs.forEach(d => courseMap.set(d.id, { id: d.id, ...d.data() }));
    }

    // 2. Directly assigned courses
    const assignedSnap = await adminDb.collection('courses').where('assignedTo', 'array-contains', uid).get();
    assignedSnap.docs.forEach(d => courseMap.set(d.id, { id: d.id, ...d.data() }));

    // 3. Individually enrolled courses (via purchase or direct enrollment)
    if (enrolledCourseIds.length > 0) {
      const missing = enrolledCourseIds.filter(id => !courseMap.has(id));
      if (missing.length > 0) {
        const docs = await Promise.all(missing.map(id => adminDb.collection('courses').doc(id).get()));
        docs.forEach(d => { if (d.exists) courseMap.set(d.id, { id: d.id, ...d.data() }); });
      }
    }

    const courses = Array.from(courseMap.values());
    return NextResponse.json({ courses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
