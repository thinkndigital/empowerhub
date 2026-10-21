import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { liveSessions, liveSessionRegistrations } from '@/lib/schema';
import { asc, eq, inArray, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const sessionRows = await db.select().from(liveSessions).where(eq(liveSessions.status, 'published')).orderBy(asc(liveSessions.date));

    const sessionIds = sessionRows.map(s => s.id);
    const counts = sessionIds.length
      ? await db.select({ sessionId: liveSessionRegistrations.sessionId, c: sql<number>`count(*)` })
          .from(liveSessionRegistrations).where(inArray(liveSessionRegistrations.sessionId, sessionIds)).groupBy(liveSessionRegistrations.sessionId)
      : [];
    const countMap = new Map(counts.map(c => [c.sessionId, Number(c.c)]));

    const sessions = sessionRows.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      coverImageUrl: s.coverImageUrl,
      coachName: s.coachName,
      date: s.date,
      duration: s.duration,
      price: s.price,
      maxParticipants: s.maxParticipants,
      registrationsCount: countMap.get(s.id) || 0,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
