import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrollments, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [enroll] = await db.select().from(enrollments)
      .where(and(eq(enrollments.courseId, params.courseId), eq(enrollments.userId, decoded.uid))).limit(1);

    if (!enroll) {
      return NextResponse.json({ enrolled: false, progress: 0, completedLessons: [] });
    }

    return NextResponse.json({
      enrolled: true,
      progress: enroll.progress ?? 0,
      completedLessons: enroll.completedLessons ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();

    const [enroll] = await db.select().from(enrollments)
      .where(and(eq(enrollments.courseId, params.courseId), eq(enrollments.userId, decoded.uid))).limit(1);
    if (!enroll) return NextResponse.json({ error: 'Not enrolled' }, { status: 404 });

    const completedLessons = new Set(enroll.completedLessons ?? []);
    if (body.completedLesson) completedLessons.add(body.completedLesson);

    await db.update(enrollments)
      .set({ progress: body.progress, completedLessons: Array.from(completedLessons) })
      .where(and(eq(enrollments.courseId, params.courseId), eq(enrollments.userId, decoded.uid)));

    // Recalculate overall user progress from all enrolled courses
    try {
      const rows = await db.select().from(enrollments).where(eq(enrollments.userId, decoded.uid));
      const avgProgress = rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + (r.progress ?? 0), 0) / rows.length)
        : 0;
      await db.update(users).set({ progress: avgProgress }).where(eq(users.id, decoded.uid));
    } catch { /* non-critical */ }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
