import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { liveSessions, liveSessionRegistrations, users } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, params.id)).limit(1);
    if (!session || session.coachId !== decoded.uid) {
      return NextResponse.json({ error: 'غير موجود أو غير مصرح' }, { status: 404 });
    }

    const registrations = await db.select().from(liveSessionRegistrations)
      .where(eq(liveSessionRegistrations.sessionId, params.id))
      .orderBy(desc(liveSessionRegistrations.registeredAt));
    return NextResponse.json({ registrations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
