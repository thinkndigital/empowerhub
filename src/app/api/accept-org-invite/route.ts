import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { signAuthToken } from '@/lib/auth-server';
import { checkOrgLimit, checkOrgLocked } from '@/lib/plan-limits';

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, uid } = await req.json();
    if (!inviteCode || !uid) {
      return NextResponse.json({ error: 'inviteCode and uid are required' }, { status: 400 });
    }

    const [org] = await db.select().from(organizations)
      .where(eq(organizations.inviteCode, inviteCode.trim().toUpperCase())).limit(1);

    if (!org) {
      return NextResponse.json({ error: 'كود الدعوة غير صحيح' }, { status: 404 });
    }

    const organizationId = org.id;

    const lockCheck = await checkOrgLocked(organizationId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: lockCheck.message }, { status: 403 });
    }

    const [userRow] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    const role = userRow?.role;
    const limitKey = role === 'beneficiary' ? 'maxUsers' : role === 'mentor' || role === 'coach' ? 'maxMentors' : null;
    if (limitKey) {
      const limitCheck = await checkOrgLimit(organizationId, limitKey as 'maxUsers' | 'maxMentors');
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.message }, { status: 403 });
      }
    }

    await db.update(users).set({ organizationId }).where(eq(users.id, uid));

    // Issue a fresh token reflecting the new organizationId so the client
    // doesn't need a full logout/login for the change to take effect.
    const token = role ? signAuthToken({ uid, role, organizationId }) : undefined;

    return NextResponse.json({ success: true, organizationId, token });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
