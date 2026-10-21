import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, stripPasswords } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    let orgId = decoded.organizationId;
    if (!orgId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const rows = await db.select().from(users)
      .where(and(eq(users.organizationId, orgId), inArray(users.role, ['organization', 'team_member'])));

    return NextResponse.json({ team: stripPasswords(rows) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    let orgId = decoded.organizationId;
    if (!orgId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const { memberId } = await req.json();
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });

    await db.delete(users).where(eq(users.id, memberId));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
