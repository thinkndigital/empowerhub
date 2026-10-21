import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mentoringSessions, users } from '@/lib/schema';
import { and, asc, eq, gte, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await db.select().from(mentoringSessions)
      .where(and(eq(mentoringSessions.isPublic, true), eq(mentoringSessions.status, 'scheduled'), gte(mentoringSessions.date, new Date())))
      .orderBy(asc(mentoringSessions.date));

    const hostIds = Array.from(new Set(rows.map(s => s.hostId).filter((id): id is string => !!id)));
    const hostRows = hostIds.length ? await db.select().from(users).where(inArray(users.id, hostIds)) : [];
    const hostById = new Map(hostRows.map(u => [u.id, u]));

    const sessions = rows.map(s => {
      const host = s.hostId ? hostById.get(s.hostId) : undefined;
      return {
        id: s.id,
        title: s.title || '',
        description: s.description || '',
        date: s.date,
        duration: s.duration || 60,
        meetLink: s.meetLink || '',
        bannerUrl: s.bannerUrl || '',
        imageUrls: s.imageUrls || [],
        hostId: s.hostId || '',
        hostName: host?.name || host?.displayName || '',
        hostAvatarUrl: host?.avatarUrl || '',
        price: s.price ?? null,
      };
    });

    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
