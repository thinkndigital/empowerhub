import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getOrgHistory } from '@/lib/org-history';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const userData = userDoc.data()!;

    // Mentor name
    let mentorName = '';
    if (userData.mentorId) {
      const mDoc = await adminDb.collection('users').doc(userData.mentorId).get();
      mentorName = mDoc.data()?.name || '';
    }
    // Coach name
    let coachName = '';
    if (userData.coachId) {
      const cDoc = await adminDb.collection('users').doc(userData.coachId).get();
      coachName = cDoc.data()?.name || '';
    }

    // Sessions as attendee OR as host
    const [attendeeSnap, hostSnap] = await Promise.all([
      adminDb.collection('sessions').where('attendees', 'array-contains', userId).get(),
      adminDb.collection('sessions').where('hostId', '==', userId).get(),
    ]);
    const sessionMap = new Map<string, any>();
    for (const d of [...attendeeSnap.docs, ...hostSnap.docs]) {
      if (!sessionMap.has(d.id)) sessionMap.set(d.id, { id: d.id, ...d.data() });
    }
    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Enrolled courses (for beneficiaries)
    const coursesSnap = await adminDb.collection('courses').get();
    const enrolledCourses: any[] = [];
    for (const cDoc of coursesSnap.docs) {
      const enrollment = await adminDb.collection('courses').doc(cDoc.id)
        .collection('enrollments').doc(userId).get();
      if (enrollment.exists) {
        enrolledCourses.push({
          id: cDoc.id,
          title: cDoc.data().title,
          progress: enrollment.data()?.progress ?? 0,
          enrolledAt: enrollment.data()?.enrolledAt || enrollment.data()?.createdAt || null,
        });
      }
    }

    // Courses created by this user (for coaches), with enrollments + beneficiary names
    const createdCoursesSnap = await adminDb.collection('courses').where('createdBy', '==', userId).get();
    const createdCourses: any[] = [];
    for (const cDoc of createdCoursesSnap.docs) {
      const enrollSnap = await adminDb.collection('courses').doc(cDoc.id).collection('enrollments').get();
      const enrollments: any[] = [];
      for (const e of enrollSnap.docs) {
        const uDoc = await adminDb.collection('users').doc(e.id).get();
        enrollments.push({
          userId: e.id,
          name: uDoc.data()?.name || e.id,
          progress: e.data().progress ?? 0,
          enrolledAt: e.data().enrolledAt || e.data().createdAt || null,
        });
      }
      createdCourses.push({
        id: cDoc.id,
        title: cDoc.data().title,
        status: cDoc.data().status,
        enrollments,
      });
    }

    const organizationHistory = await getOrgHistory(userId);

    // Earnings — the org sets a per-attendee price for mentorship vs. coaching
    // sessions (organizations/{orgId}.mentorshipSessionPrice / courseSessionPrice);
    // this turns that price into an actual figure for what this mentor/coach
    // has earned from their own completed, hosted sessions.
    let earnings: { pricePerAttendee: number; completedSessions: number; totalAttendees: number; total: number } | null = null;
    if ((userData.role === 'mentor' || userData.role === 'coach') && userData.organizationId) {
      const orgSnap = await adminDb.collection('organizations').doc(userData.organizationId).get();
      const orgData = orgSnap.data();
      const pricePerAttendee = (userData.role === 'mentor'
        ? orgData?.mentorshipSessionPrice
        : orgData?.courseSessionPrice) ?? 0;

      const hostedCompleted = sessions.filter((s: any) => s.hostId === userId && s.status === 'completed');
      const totalAttendees = hostedCompleted.reduce((sum: number, s: any) => {
        const count = Array.isArray(s.attendees) ? s.attendees.length : (s.beneficiaryId ? 1 : 0);
        return sum + count;
      }, 0);

      earnings = {
        pricePerAttendee,
        completedSessions: hostedCompleted.length,
        totalAttendees,
        total: pricePerAttendee * totalAttendees,
      };
    }

    return NextResponse.json({
      profile: {
        id: userId,
        ...userData,
        mentorName,
        coachName,
        sessions,
        enrolledCourses,
        createdCourses,
        organizationHistory,
        earnings,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
