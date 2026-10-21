import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, courses, enrollments } from '@/lib/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    let orgId = decoded.organizationId;
    if (!orgId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const coachRows = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.organizationId, orgId), eq(users.role, 'coach')));
    const coachIds = coachRows.map(c => c.id);

    const courseRows = await db.select().from(courses).where(
      coachIds.length
        ? or(eq(courses.organizationId, orgId), inArray(courses.createdBy, coachIds))
        : eq(courses.organizationId, orgId)
    );

    const courseIds = courseRows.map(c => c.id);
    const enrollRows = courseIds.length
      ? await db.select().from(enrollments).where(inArray(enrollments.courseId, courseIds))
      : [];
    const enrollsByCourse = new Map<string, typeof enrollRows>();
    for (const e of enrollRows) {
      if (!enrollsByCourse.has(e.courseId)) enrollsByCourse.set(e.courseId, []);
      enrollsByCourse.get(e.courseId)!.push(e);
    }

    const result = courseRows.map(c => {
      const courseEnrolls = enrollsByCourse.get(c.id) || [];
      return {
        ...c,
        enrolledCount: courseEnrolls.length,
        enrollments: courseEnrolls.map(e => ({ userId: e.userId, progress: e.progress ?? 0 })),
      };
    });

    return NextResponse.json({ courses: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
