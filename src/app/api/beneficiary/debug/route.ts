import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // User profile
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userProfile = userDoc.exists ? { id: uid, ...userDoc.data() } : null;

    // Sessions - all queries
    const [sessAttendees, sessBeneficiary] = await Promise.all([
      adminDb.collection('sessions').where('attendees', 'array-contains', uid).get(),
      adminDb.collection('sessions').where('beneficiaryId', '==', uid).get(),
    ]);
    const sessionIds = new Set<string>();
    const sessions: any[] = [];
    for (const d of [...sessAttendees.docs, ...sessBeneficiary.docs]) {
      if (sessionIds.has(d.id)) continue;
      sessionIds.add(d.id);
      const data = d.data();
      let date = data.date;
      if (date && typeof date === 'object' && (date._seconds || date.seconds)) {
        date = new Date((date._seconds ?? date.seconds) * 1000).toISOString();
      }
      sessions.push({ id: d.id, title: data.title, date, status: data.status, attendees: data.attendees, beneficiaryId: data.beneficiaryId });
    }

    // All sessions count (to know if sessions exist at all)
    const allSessionsSnap = await adminDb.collection('sessions').limit(5).get();
    const sampleSessions = allSessionsSnap.docs.map(d => ({
      id: d.id, attendees: d.data().attendees, beneficiaryId: d.data().beneficiaryId, hostId: d.data().hostId
    }));

    // Courses and enrollments
    const coursesSnap = await adminDb.collection('courses').get();
    const myEnrollments: any[] = [];
    const allCourses: any[] = [];
    for (const d of coursesSnap.docs) {
      allCourses.push({ id: d.id, title: d.data().title, status: d.data().status });
      const enrollDoc = await adminDb.collection('courses').doc(d.id).collection('enrollments').doc(uid).get();
      if (enrollDoc.exists) {
        myEnrollments.push({ courseId: d.id, courseTitle: d.data().title, ...enrollDoc.data() });
      }
    }

    // Store
    const storeSnap = await adminDb.collection('stores').where('beneficiaryId', '==', uid).limit(1).get();
    const store = storeSnap.empty ? null : { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };

    // Products
    const productsSnap = await adminDb.collection('products').where('userId', '==', uid).get();
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      uid,
      userProfile,
      sessions: { myCount: sessions.length, mySessions: sessions, sampleAllSessions: sampleSessions },
      courses: { allCount: allCourses.length, allCourses, myEnrollmentsCount: myEnrollments.length, myEnrollments },
      store,
      products,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
