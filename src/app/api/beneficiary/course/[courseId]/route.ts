import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { courses, courseLessons, enrollments } from '@/lib/schema';
import { and, asc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [course] = await db.select().from(courses).where(eq(courses.id, params.courseId)).limit(1);
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [enroll] = await db.select().from(enrollments)
      .where(and(eq(enrollments.courseId, params.courseId), eq(enrollments.userId, uid))).limit(1);

    const lessons = await db.select().from(courseLessons)
      .where(eq(courseLessons.courseId, params.courseId))
      .orderBy(asc(courseLessons.sortOrder));

    return NextResponse.json({ course, progress: enroll?.progress ?? 0, lessons });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;
    const { progress } = await req.json();

    await db.update(enrollments).set({ progress })
      .where(and(eq(enrollments.courseId, params.courseId), eq(enrollments.userId, uid)));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
