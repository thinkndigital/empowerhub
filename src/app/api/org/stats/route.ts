import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthToken, stripPasswords } from '@/lib/auth-server';

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

    const [beneficiaryRows, mentorRows, coachRows] = await Promise.all([
      db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'beneficiary'))),
      db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'mentor'))),
      db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'coach'))),
    ]);

    const beneficiaries = stripPasswords(beneficiaryRows);
    const avgProgress = beneficiaries.length > 0
      ? Math.round(beneficiaries.reduce((s, b) => s + (b.progress || 0), 0) / beneficiaries.length)
      : 0;

    return NextResponse.json({
      beneficiariesCount: beneficiaryRows.length,
      mentorsCount: mentorRows.length,
      coachesCount: coachRows.length,
      avgProgress,
      recentBeneficiaries: beneficiaries.slice(0, 5),
      beneficiaries,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
