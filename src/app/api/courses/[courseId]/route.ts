import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

// Fields with no dedicated column — stored in courses.meta (JSON) and
// flattened back onto the course object on read, since the coach/admin
// course editors and the beneficiary training viewer all read/write them
// as top-level course fields.
const META_FIELDS = ['quiz', 'preAssessment', 'postAssessment', 'videoUrl'] as const;

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const [course] = await db.select().from(courses).where(eq(courses.id, params.courseId)).limit(1);
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { meta, ...rest } = course;
    return NextResponse.json({ course: { ...rest, ...(meta || {}) } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const body = await req.json();

    const metaPatch: Record<string, any> = {};
    const columnUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if ((META_FIELDS as readonly string[]).includes(key)) metaPatch[key] = value;
      else columnUpdates[key] = value;
    }

    if (Object.keys(metaPatch).length) {
      const [existing] = await db.select({ meta: courses.meta }).from(courses).where(eq(courses.id, params.courseId)).limit(1);
      columnUpdates.meta = { ...(existing?.meta || {}), ...metaPatch };
    }

    await db.update(courses).set(columnUpdates).where(eq(courses.id, params.courseId));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
