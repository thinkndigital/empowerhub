import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, mentoringSessions, sessionAttendees, courses, enrollments } from '@/lib/schema';
import { eq, or, inArray, desc } from 'drizzle-orm';
import { verifyAuthToken, stripPassword } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRow) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let mentorName = '';
    if (userRow.mentorId) {
      const [m] = await db.select().from(users).where(eq(users.id, userRow.mentorId)).limit(1);
      mentorName = m?.name || '';
    }
    let coachName = '';
    if (userRow.coachId) {
      const [c] = await db.select().from(users).where(eq(users.id, userRow.coachId)).limit(1);
      coachName = c?.name || '';
    }

    // Sessions as attendee OR as host — unified via the session_attendees join
    // table (replaces the old dual attendees[]-array-vs-hostId Firestore pattern).
    const attendeeLinks = await db.select().from(sessionAttendees).where(eq(sessionAttendees.userId, userId));
    const attendeeSessionIds = attendeeLinks.map(l => l.sessionId);
    const sessionRows = await db.select().from(mentoringSessions).where(
      attendeeSessionIds.length
        ? or(eq(mentoringSessions.hostId, userId), inArray(mentoringSessions.id, attendeeSessionIds))
        : eq(mentoringSessions.hostId, userId)
    ).orderBy(desc(mentoringSessions.date));

    // Enrolled courses (for beneficiaries)
    const enrollRows = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    const enrolledCourseIds = enrollRows.map(e => e.courseId);
    const enrolledCourseRows = enrolledCourseIds.length
      ? await db.select().from(courses).where(inArray(courses.id, enrolledCourseIds))
      : [];
    const courseTitleById = new Map(enrolledCourseRows.map(c => [c.id, c.title]));
    const enrolledCourses = enrollRows.map(e => ({
      id: e.courseId,
      title: courseTitleById.get(e.courseId) || '',
      progress: e.progress ?? 0,
      enrolledAt: e.enrolledAt,
    }));

    // Courses created by this user (for coaches), with enrollments + beneficiary names
    const createdCourseRows = await db.select().from(courses).where(eq(courses.createdBy, userId));
    const createdCourses = await Promise.all(createdCourseRows.map(async (c) => {
      const enrolls = await db.select().from(enrollments).where(eq(enrollments.courseId, c.id));
      const enrolledUserIds = enrolls.map(e => e.userId);
      const enrolledUsers = enrolledUserIds.length
        ? await db.select().from(users).where(inArray(users.id, enrolledUserIds))
        : [];
      const nameById = new Map(enrolledUsers.map(u => [u.id, u.name]));
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        enrollments: enrolls.map(e => ({
          userId: e.userId,
          name: nameById.get(e.userId) || e.userId,
          progress: e.progress ?? 0,
          enrolledAt: e.enrolledAt,
        })),
      };
    }));

    return NextResponse.json({
      profile: {
        ...stripPassword(userRow),
        mentorName,
        coachName,
        sessions: sessionRows,
        enrolledCourses,
        createdCourses,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
