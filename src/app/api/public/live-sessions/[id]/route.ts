import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { liveSessions, liveSessionRegistrations } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, params.id)).limit(1);
    if (!session) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }
    if (session.status !== 'published') {
      return NextResponse.json({ error: 'غير متاح' }, { status: 404 });
    }

    const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(liveSessionRegistrations).where(eq(liveSessionRegistrations.sessionId, params.id));

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        coverImageUrl: session.coverImageUrl,
        coachName: session.coachName,
        date: session.date,
        duration: session.duration,
        price: session.price,
        maxParticipants: session.maxParticipants,
        registrationsCount: Number(c),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
