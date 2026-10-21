import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, users } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const courseRows = await db.select().from(courses).where(eq(courses.status, 'published')).limit(12);

    const coachIds = Array.from(new Set(courseRows.map(c => c.createdBy).filter((id): id is string => !!id)));
    const coachRows = coachIds.length ? await db.select().from(users).where(inArray(users.id, coachIds)) : [];
    const coachById = new Map(coachRows.map(u => [u.id, u]));

    const result = courseRows.map(c => {
      const coach = c.createdBy ? coachById.get(c.createdBy) : undefined;
      return {
        id: c.id,
        title: c.title || '',
        description: c.description || '',
        price: c.price ?? null,
        coverImageUrl: c.coverImageUrl || '',
        duration: c.duration || '',
        createdBy: c.createdBy || '',
        coachName: coach?.name || coach?.displayName || c.coachName || '',
        enrollmentCount: c.enrolledCount || 0,
        level: c.level || '',
        language: c.language || '',
        tags: c.tags || [],
        coachAvatarUrl: coach?.avatarUrl || '',
      };
    });

    return NextResponse.json({ courses: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
