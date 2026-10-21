import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { mentoringSessions, sessionAttendees } from '@/lib/schema';
import { eq, inArray, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const attendeeRows = await db.select().from(sessionAttendees).where(eq(sessionAttendees.userId, uid));
    const attendeeSessionIds = attendeeRows.map(a => a.sessionId);

    const whereClause = attendeeSessionIds.length
      ? or(inArray(mentoringSessions.id, attendeeSessionIds), eq(mentoringSessions.beneficiaryId, uid))
      : eq(mentoringSessions.beneficiaryId, uid);

    const sessionRows = await db.select().from(mentoringSessions).where(whereClause);

    const allSessionIds = sessionRows.map(s => s.id);
    const allAttendeeRows = allSessionIds.length
      ? await db.select().from(sessionAttendees).where(inArray(sessionAttendees.sessionId, allSessionIds))
      : [];
    const attendeesBySession = new Map<string, string[]>();
    for (const a of allAttendeeRows) {
      const list = attendeesBySession.get(a.sessionId) || [];
      list.push(a.userId);
      attendeesBySession.set(a.sessionId, list);
    }

    const sessions = sessionRows
      .map(s => ({ ...s, attendees: attendeesBySession.get(s.id) || [] }))
      .sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0));

    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
