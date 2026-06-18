import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token); // caller must be authenticated
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const userData = userDoc.data()!;

    // Get mentor name
    let mentorName = '';
    if (userData.mentorId) {
      const mDoc = await adminDb.collection('users').doc(userData.mentorId).get();
      mentorName = mDoc.data()?.name || '';
    }
    // Get coach name
    let coachName = '';
    if (userData.coachId) {
      const cDoc = await adminDb.collection('users').doc(userData.coachId).get();
      coachName = cDoc.data()?.name || '';
    }
    // Get sessions (as attendee)
    const sessionsSnap = await adminDb.collection('sessions')
      .where('attendees', 'array-contains', userId).orderBy('date', 'desc').limit(10).get();
    const sessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get enrolled courses
    const coursesSnap = await adminDb.collection('courses').get();
    const enrolledCourses: any[] = [];
    for (const cDoc of coursesSnap.docs) {
      const enrollment = await adminDb.collection('courses').doc(cDoc.id).collection('enrollments').doc(userId).get();
      if (enrollment.exists) {
        enrolledCourses.push({ id: cDoc.id, title: cDoc.data().title, progress: enrollment.data()?.progress ?? 0 });
      }
    }

    return NextResponse.json({
      profile: {
        id: userId,
        ...userData,
        mentorName,
        coachName,
        sessions,
        enrolledCourses,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
