import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, enrollments, users, notifications } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { verifyAuthToken } from '@/lib/auth-server';

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();

    let beneficiaryId = decoded.uid;

    if (body.beneficiaryId && body.beneficiaryId !== decoded.uid) {
      // Only coaches or orgs can enroll other users
      const [caller] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      if (caller?.role !== 'coach' && caller?.role !== 'organization') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      beneficiaryId = body.beneficiaryId;
    }

    const [course] = await db.select().from(courses).where(eq(courses.id, params.courseId)).limit(1);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const courseTitle = course.title || 'الدورة';

    const [existing] = await db.select().from(enrollments)
      .where(and(eq(enrollments.courseId, params.courseId), eq(enrollments.userId, beneficiaryId))).limit(1);
    if (existing) {
      return NextResponse.json({ success: true, alreadyEnrolled: true });
    }

    await db.insert(enrollments).values({
      id: randomUUID(),
      courseId: params.courseId,
      userId: beneficiaryId,
      progress: 0,
    });

    await db.update(courses).set({ enrolledCount: sql`${courses.enrolledCount} + 1` }).where(eq(courses.id, params.courseId));

    await db.insert(notifications).values({
      id: randomUUID(),
      userId: beneficiaryId,
      type: 'course_enrollment',
      title: 'تسجيل في دورة جديدة',
      body: `تم تسجيلك في دورة ${courseTitle}`,
      link: '/beneficiary-dashboard/courses',
      read: false,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();

    let beneficiaryId = decoded.uid;

    if (body.beneficiaryId && body.beneficiaryId !== decoded.uid) {
      const [caller] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      if (caller?.role !== 'coach' && caller?.role !== 'organization') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      beneficiaryId = body.beneficiaryId;
    }

    await db.delete(enrollments).where(and(eq(enrollments.courseId, params.courseId), eq(enrollments.userId, beneficiaryId)));
    await db.update(courses).set({ enrolledCount: sql`GREATEST(${courses.enrolledCount} - 1, 0)` }).where(eq(courses.id, params.courseId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
