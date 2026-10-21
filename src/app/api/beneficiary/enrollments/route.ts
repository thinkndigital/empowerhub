import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { courses, enrollments } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const myEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, uid));
    const courseIds = myEnrollments.map(e => e.courseId);
    const courseRows = courseIds.length ? await db.select().from(courses).where(inArray(courses.id, courseIds)) : [];
    const titleById = new Map(courseRows.map(c => [c.id, c.title]));

    const result = myEnrollments.map(e => ({
      courseId: e.courseId,
      title: titleById.get(e.courseId) || '',
      progress: e.progress ?? 0,
      enrolledAt: e.enrolledAt?.toISOString?.() || null,
    }));

    return NextResponse.json({ enrollments: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
