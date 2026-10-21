import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { courses, users, enrollments } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [course] = await db.select().from(courses).where(eq(courses.id, params.id)).limit(1);
    if (!course) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    if (course.status !== 'published') return NextResponse.json({ error: 'غير متاح' }, { status: 404 });

    let coachName = course.coachName || '';
    let coachAvatarUrl = '';
    if (course.createdBy) {
      const [coach] = await db.select().from(users).where(eq(users.id, course.createdBy)).limit(1);
      if (coach) {
        coachName = coachName || coach.name || coach.displayName || '';
        coachAvatarUrl = coach.avatarUrl || '';
      }
    }

    // Check enrollment status if auth token is provided
    let isEnrolled = false;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const decoded = await verifyAuthToken(authHeader.replace('Bearer ', ''));
        const [enroll] = await db.select().from(enrollments)
          .where(and(eq(enrollments.courseId, params.id), eq(enrollments.userId, decoded.uid))).limit(1);
        isEnrolled = !!enroll;
      } catch { /* unauthenticated is fine */ }
    }

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title || '',
        description: course.description || '',
        price: course.price ?? null,
        coverImageUrl: course.coverImageUrl || '',
        duration: course.duration || '',
        createdBy: course.createdBy || '',
        coachName,
        coachAvatarUrl,
        enrollmentCount: course.enrolledCount || 0,
        objectives: course.objectives || [],
        requirements: course.requirements || [],
        isEnrolled,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
