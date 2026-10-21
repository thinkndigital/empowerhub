import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { courses, enrollments, users } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [userRow] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    const orgId = userRow?.organizationId || decoded.organizationId;

    const courseMap = new Map<string, typeof courses.$inferSelect>();

    // 1. Org-wide courses, visible to every beneficiary of the org
    if (orgId) {
      const rows = await db.select().from(courses).where(eq(courses.organizationId, orgId));
      rows.forEach(c => courseMap.set(c.id, c));
    }

    // 2. Courses this beneficiary is enrolled in (assigned, self-enrolled, or purchased)
    const myEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, uid));
    const missingIds = myEnrollments.map(e => e.courseId).filter(id => !courseMap.has(id));
    if (missingIds.length) {
      const rows = await db.select().from(courses).where(inArray(courses.id, missingIds));
      rows.forEach(c => courseMap.set(c.id, c));
    }

    return NextResponse.json({ courses: Array.from(courseMap.values()) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
