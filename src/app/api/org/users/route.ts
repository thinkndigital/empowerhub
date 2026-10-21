import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users as usersTable } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthToken, stripPasswords } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAuthToken(token);
    let orgId = decoded.organizationId;

    const role = req.nextUrl.searchParams.get('role') || 'beneficiary';
    const scope = req.nextUrl.searchParams.get('scope') || 'all';
    const mentorId = req.nextUrl.searchParams.get('mentorId');
    const coachId = req.nextUrl.searchParams.get('coachId');

    if (!mentorId && !coachId && !orgId) {
      const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }

    if (!mentorId && !coachId && !orgId) {
      return NextResponse.json({ error: 'Not an org' }, { status: 403 });
    }

    let rows;
    if (mentorId) {
      rows = await db.select().from(usersTable)
        .where(and(eq(usersTable.role, 'beneficiary'), eq(usersTable.mentorId, mentorId)));
    } else if (coachId) {
      rows = await db.select().from(usersTable)
        .where(and(eq(usersTable.role, 'beneficiary'), eq(usersTable.coachId, coachId)));
    } else if (scope === 'org') {
      rows = await db.select().from(usersTable)
        .where(and(eq(usersTable.role, role as any), eq(usersTable.organizationId, orgId!)));
    } else {
      rows = await db.select().from(usersTable).where(eq(usersTable.role, role as any));
    }

    return NextResponse.json({ users: stripPasswords(rows) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
