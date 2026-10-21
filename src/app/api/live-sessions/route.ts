import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { liveSessions, liveSessionRegistrations, users } from '@/lib/schema';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const sessionRows = await db.select().from(liveSessions).where(eq(liveSessions.coachId, decoded.uid)).orderBy(desc(liveSessions.createdAt));

    const sessionIds = sessionRows.map(s => s.id);
    const counts = sessionIds.length
      ? await db.select({ sessionId: liveSessionRegistrations.sessionId, c: sql<number>`count(*)` })
          .from(liveSessionRegistrations).where(inArray(liveSessionRegistrations.sessionId, sessionIds)).groupBy(liveSessionRegistrations.sessionId)
      : [];
    const countMap = new Map(counts.map(c => [c.sessionId, Number(c.c)]));

    const sessions = sessionRows.map(s => ({ ...s, registrationsCount: countMap.get(s.id) || 0 }));
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, description = '', coverImageUrl = '',
      date, duration = 60, meetLink = '',
      price = 0, maxParticipants = null, status = 'draft',
    } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'العنوان والتاريخ مطلوبان' }, { status: 400 });
    }

    const orgId = userRow?.organizationId || decoded.organizationId || null;

    const id = randomUUID();
    await db.insert(liveSessions).values({
      id,
      coachId: decoded.uid,
      coachName: userRow?.name || '',
      organizationId: orgId,
      title,
      description,
      coverImageUrl,
      date: new Date(date),
      duration: String(duration),
      meetLink,
      price: String(Number(price)),
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      status,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
