import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, stripPassword } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users, mentoringSessions, sessionAttendees, courses, enrollments, stores, products } from '@/lib/schema';
import { and, eq, inArray, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [userRow] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    const userProfile = userRow ? stripPassword(userRow) : null;

    const attendeeRows = await db.select().from(sessionAttendees).where(eq(sessionAttendees.userId, uid));
    const attendeeSessionIds = attendeeRows.map(a => a.sessionId);
    const whereClause = attendeeSessionIds.length
      ? or(inArray(mentoringSessions.id, attendeeSessionIds), eq(mentoringSessions.beneficiaryId, uid))
      : eq(mentoringSessions.beneficiaryId, uid);
    const sessionRows = await db.select().from(mentoringSessions).where(whereClause);
    const sessionIds = sessionRows.map(s => s.id);
    const theirAttendeeRows = sessionIds.length
      ? await db.select().from(sessionAttendees).where(inArray(sessionAttendees.sessionId, sessionIds))
      : [];
    const attendeesBySession = new Map<string, string[]>();
    for (const a of theirAttendeeRows) {
      const list = attendeesBySession.get(a.sessionId) || [];
      list.push(a.userId);
      attendeesBySession.set(a.sessionId, list);
    }
    const sessions = sessionRows.map(s => ({
      id: s.id, title: s.title, date: s.date, status: s.status,
      attendees: attendeesBySession.get(s.id) || [], beneficiaryId: s.beneficiaryId,
    }));

    const sampleRows = await db.select().from(mentoringSessions).limit(5);
    const sampleIds = sampleRows.map(s => s.id);
    const sampleAttendeeRows = sampleIds.length
      ? await db.select().from(sessionAttendees).where(inArray(sessionAttendees.sessionId, sampleIds))
      : [];
    const sampleAttendeesBySession = new Map<string, string[]>();
    for (const a of sampleAttendeeRows) {
      const list = sampleAttendeesBySession.get(a.sessionId) || [];
      list.push(a.userId);
      sampleAttendeesBySession.set(a.sessionId, list);
    }
    const sampleSessions = sampleRows.map(s => ({
      id: s.id, attendees: sampleAttendeesBySession.get(s.id) || [], beneficiaryId: s.beneficiaryId, hostId: s.hostId,
    }));

    const allCourseRows = await db.select().from(courses);
    const allCourses = allCourseRows.map(c => ({ id: c.id, title: c.title, status: c.status }));
    const myEnrollmentRows = allCourseRows.length
      ? await db.select().from(enrollments).where(and(inArray(enrollments.courseId, allCourseRows.map(c => c.id)), eq(enrollments.userId, uid)))
      : [];
    const courseById = new Map(allCourseRows.map(c => [c.id, c]));
    const myEnrollments = myEnrollmentRows.map(e => ({ ...e, courseTitle: courseById.get(e.courseId)?.title }));

    const [storeRow] = await db.select().from(stores).where(eq(stores.beneficiaryId, uid)).limit(1);
    const store = storeRow || null;

    const productRows = await db.select().from(products).where(eq(products.userId, uid));

    return NextResponse.json({
      uid,
      userProfile,
      sessions: { myCount: sessions.length, mySessions: sessions, sampleAllSessions: sampleSessions },
      courses: { allCount: allCourses.length, allCourses, myEnrollmentsCount: myEnrollments.length, myEnrollments },
      store,
      products: productRows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
