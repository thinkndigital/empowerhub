import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, liveSessions, liveSessionRegistrations } from '@/lib/schema';
import { eq, asc, inArray, sql } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [caller] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const orgId = caller?.organizationId || decoded.organizationId || '';
    if (!orgId || caller?.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const sessionRows = await db.select().from(liveSessions)
      .where(eq(liveSessions.organizationId, orgId))
      .orderBy(asc(liveSessions.date));

    const sessionIds = sessionRows.map(s => s.id);
    const counts = sessionIds.length
      ? await db.select({ sessionId: liveSessionRegistrations.sessionId, c: sql<number>`count(*)` })
          .from(liveSessionRegistrations)
          .where(inArray(liveSessionRegistrations.sessionId, sessionIds))
          .groupBy(liveSessionRegistrations.sessionId)
      : [];
    const countMap = new Map(counts.map(c => [c.sessionId, Number(c.c)]));

    const sessions = sessionRows.map(s => ({
      id: s.id,
      title: s.title,
      coachName: s.coachName,
      date: s.date,
      duration: s.duration,
      price: s.price,
      maxParticipants: s.maxParticipants,
      status: s.status,
      coverImageUrl: s.coverImageUrl,
      registrationsCount: countMap.get(s.id) || 0,
    }));

    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
