import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, liveSessions } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: { coachId: string } }) {
  try {
    const { coachId } = params;

    const [courseRows, liveRows] = await Promise.all([
      db.select().from(courses).where(and(eq(courses.createdBy, coachId), eq(courses.status, 'published'))),
      db.select().from(liveSessions).where(and(eq(liveSessions.coachId, coachId), eq(liveSessions.status, 'published'))),
    ]);

    const coursesResult = courseRows.map(c => ({ id: c.id, title: c.title || '', type: 'course' as const }));
    const liveSessionsResult = liveRows.map(s => ({ id: s.id, title: s.title || '', type: 'live_session' as const }));

    return NextResponse.json({ courses: coursesResult, liveSessions: liveSessionsResult });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
