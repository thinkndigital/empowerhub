import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { mentoringSessions, sessionAttendees, users, notifications } from '@/lib/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const SESSION_FIELDS = [
  'title', 'description', 'date', 'duration', 'status', 'meetLink',
  'bannerUrl', 'imageUrls', 'isPublic', 'price', 'beneficiaryId',
] as const;

async function attachAttendees<T extends { id: string }>(sessionRows: T[]) {
  const sessionIds = sessionRows.map(s => s.id);
  const attendeeRows = sessionIds.length
    ? await db.select().from(sessionAttendees).where(inArray(sessionAttendees.sessionId, sessionIds))
    : [];
  const byId = new Map<string, string[]>();
  for (const a of attendeeRows) {
    const list = byId.get(a.sessionId) || [];
    list.push(a.userId);
    byId.set(a.sessionId, list);
  }
  return sessionRows.map(s => ({ ...s, attendees: byId.get(s.id) || [] }));
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const scope = req.nextUrl.searchParams.get('scope');
    const hostIdParam = req.nextUrl.searchParams.get('hostId');

    let sessionRows;
    if (hostIdParam) {
      sessionRows = await db.select().from(mentoringSessions).where(eq(mentoringSessions.hostId, hostIdParam)).orderBy(desc(mentoringSessions.date));
    } else if (scope === 'all') {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      const orgId = userRow?.organizationId || decoded.organizationId;
      if (userRow?.role !== 'organization' || !orgId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      sessionRows = await db.select().from(mentoringSessions).where(eq(mentoringSessions.organizationId, orgId)).orderBy(desc(mentoringSessions.date));
    } else {
      sessionRows = await db.select().from(mentoringSessions).where(eq(mentoringSessions.hostId, decoded.uid)).orderBy(desc(mentoringSessions.date));
    }

    const sessions = await attachAttendees(sessionRows);
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();

    let orgId = decoded.organizationId as string | null | undefined;
    if (!orgId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }

    const id = randomUUID();
    const values: Record<string, any> = { id, hostId: decoded.uid, organizationId: orgId || null };
    for (const field of SESSION_FIELDS) {
      if (body[field] !== undefined) values[field] = field === 'date' ? new Date(body[field]) : body[field];
    }
    await db.insert(mentoringSessions).values(values as any);

    const attendees: string[] = Array.isArray(body.attendees) ? body.attendees : [];
    if (attendees.length) {
      await db.insert(sessionAttendees).values(attendees.map(userId => ({ sessionId: id, userId })));
    }

    const sessionTitle: string = body.title || 'جلسة جديدة';
    const notificationRows: (typeof notifications.$inferInsert)[] = attendees.map(attendeeId => ({
      id: randomUUID(),
      userId: attendeeId,
      type: 'session_invite',
      title: 'دعوة جلسة جديدة',
      body: `تمت دعوتك لجلسة: ${sessionTitle}`,
      link: '/beneficiary-dashboard/sessions',
      read: false,
    }));

    if (orgId) {
      const orgUsers = await db.select().from(users).where(and(eq(users.role, 'organization'), eq(users.organizationId, orgId)));
      for (const u of orgUsers) {
        notificationRows.push({
          id: randomUUID(),
          userId: u.id,
          type: 'session_created',
          title: 'جلسة جديدة في منظمتك',
          body: `تم إنشاء جلسة جديدة: ${sessionTitle}`,
          link: '/organization-dashboard/sessions',
          read: false,
        });
      }
    }

    if (notificationRows.length) {
      await db.insert(notifications).values(notificationRows);
    }

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const { id, attendees, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updates: Record<string, any> = {};
    for (const field of SESSION_FIELDS) {
      if (fields[field] !== undefined) updates[field] = field === 'date' ? new Date(fields[field]) : fields[field];
    }
    if (Object.keys(updates).length) {
      await db.update(mentoringSessions).set(updates).where(eq(mentoringSessions.id, id));
    }

    if (Array.isArray(attendees)) {
      await db.delete(sessionAttendees).where(eq(sessionAttendees.sessionId, id));
      if (attendees.length) {
        await db.insert(sessionAttendees).values(attendees.map((userId: string) => ({ sessionId: id, userId })));
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    await db.delete(sessionAttendees).where(eq(sessionAttendees.sessionId, id));
    await db.delete(mentoringSessions).where(eq(mentoringSessions.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
