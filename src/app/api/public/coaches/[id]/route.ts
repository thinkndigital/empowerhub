import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, courses } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [coach] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!coach || coach.role !== 'coach') return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const courseRows = await db.select().from(courses)
      .where(and(eq(courses.createdBy, params.id), eq(courses.status, 'published')));

    return NextResponse.json({
      coach: {
        id: coach.id,
        name: coach.name || coach.displayName || '',
        bio: coach.bio || '',
        specializations: coach.specializations || [],
        avatarUrl: coach.avatarUrl || '',
        sessionPrice: coach.sessionPrice ?? null,
        whatsapp: coach.whatsapp || '',
        linkedin: coach.linkedin || '',
        instagram: coach.instagram || '',
        email: coach.email || '',
        courses: courseRows.map(c => ({
          id: c.id,
          title: c.title || '',
          description: c.description || '',
          price: c.price ?? null,
          coverImageUrl: c.coverImageUrl || '',
          duration: c.duration || '',
          enrollmentCount: c.enrolledCount || 0,
        })),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
