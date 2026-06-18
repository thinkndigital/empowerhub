import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type * as FirebaseFirestore from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    if (!orgId) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      orgId = userDoc.data()?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    // Get all coaches in this org
    const coachesSnap = await adminDb.collection('users')
      .where('organizationId', '==', orgId)
      .where('role', '==', 'coach').get();
    const coachIds = coachesSnap.docs.map(d => d.id);

    // Fetch courses by orgId OR by these coaches
    const [byOrgSnap, ...byCoachSnaps] = await Promise.all([
      adminDb.collection('courses').where('organizationId', '==', orgId).get(),
      ...coachIds.map(id => adminDb.collection('courses').where('createdBy', '==', id).get()),
    ]);

    // Merge, deduplicate
    const seen = new Set<string>();
    const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    for (const snap of [byOrgSnap, ...byCoachSnaps]) {
      for (const doc of snap.docs) {
        if (!seen.has(doc.id)) { seen.add(doc.id); allDocs.push(doc); }
      }
    }

    // For each course, get enrollments
    const courses = await Promise.all(allDocs.map(async d => {
      const enrollSnap = await adminDb.collection('courses').doc(d.id).collection('enrollments').get();
      const enrollments = enrollSnap.docs.map(e => ({ userId: e.id, progress: e.data().progress ?? 0 }));
      return { id: d.id, ...d.data(), enrolledCount: enrollments.length, enrollments };
    }));

    return NextResponse.json({ courses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
