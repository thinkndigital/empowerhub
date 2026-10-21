import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, mentoringSessions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthToken, stripPasswords } from '@/lib/auth-server';
import { checkOrgLocked } from '@/lib/plan-limits';

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

    const lockCheck = await checkOrgLocked(orgId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: 'التقارير ميزة مدفوعة — يرجى الاشتراك أو التجديد لعرضها.' }, { status: 403 });
    }

    const [beneficiaryRows, mentorRows, sessionRows] = await Promise.all([
      db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'beneficiary'))),
      db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'mentor'))),
      db.select().from(mentoringSessions).where(eq(mentoringSessions.organizationId, orgId)),
    ]);

    return NextResponse.json({
      beneficiaries: stripPasswords(beneficiaryRows),
      mentorsCount: mentorRows.length,
      sessions: sessionRows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
