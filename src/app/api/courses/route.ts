import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, enrollments, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { verifyAuthToken } from '@/lib/auth-server';

async function withEnrollments(courseRows: (typeof courses.$inferSelect)[]) {
  return Promise.all(courseRows.map(async (c) => {
    const enrollRows = await db.select().from(enrollments).where(eq(enrollments.courseId, c.id));
    return {
      ...c,
      enrolledCount: enrollRows.length,
      enrollments: enrollRows.map(e => ({ userId: e.userId, enrolledAt: e.enrolledAt, progress: e.progress ?? 0 })),
    };
  }));
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const allParam = req.nextUrl.searchParams.get('all');

    if (allParam === 'true') {
      const rows = await db.select().from(courses).where(eq(courses.status, 'published'));
      return NextResponse.json({ courses: await withEnrollments(rows) });
    }

    const rows = await db.select().from(courses).where(eq(courses.createdBy, decoded.uid));
    return NextResponse.json({ courses: await withEnrollments(rows) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const orgId = decoded.organizationId || userRow?.organizationId || null;
    const coachName = userRow?.name || '';

    const id = randomUUID();
    await db.insert(courses).values({
      ...body,
      id,
      createdBy: decoded.uid,
      coachName,
      organizationId: orgId,
      status: 'draft',
      enrolledCount: 0,
      completionRate: 0,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const { id, ...fields } = await req.json();
    await db.update(courses).set(fields).where(eq(courses.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    await db.delete(courses).where(eq(courses.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
