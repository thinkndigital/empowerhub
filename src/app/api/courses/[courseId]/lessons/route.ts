import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, courseLessons } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { verifyAuthToken } from '@/lib/auth-server';

async function verifyOwner(token: string, courseId: string): Promise<string> {
  const decoded = await verifyAuthToken(token);
  const uid = decoded.uid;
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) throw new Error('Course not found');
  if (course.createdBy !== uid) throw new Error('Unauthorized');
  return uid;
}

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const lessons = await db.select().from(courseLessons)
      .where(eq(courseLessons.courseId, params.courseId))
      .orderBy(asc(courseLessons.sortOrder));
    return NextResponse.json({ lessons });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOwner(token, params.courseId);
    const body = await req.json();
    const id = randomUUID();
    await db.insert(courseLessons).values({
      id,
      courseId: params.courseId,
      title: body.title,
      description: body.description || '',
      videoUrl: body.videoUrl || '',
      sortOrder: body.order ?? 0,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOwner(token, params.courseId);
    const body = await req.json();
    const { id, order, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.update(courseLessons)
      .set({ ...fields, ...(order !== undefined ? { sortOrder: order } : {}) })
      .where(eq(courseLessons.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOwner(token, params.courseId);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.delete(courseLessons).where(eq(courseLessons.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
