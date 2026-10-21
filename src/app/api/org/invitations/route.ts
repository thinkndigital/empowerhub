import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { orgInvitations, users, organizations, notifications } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken, signAuthToken } from '@/lib/auth-server';
import { checkOrgLimit, checkOrgLocked } from '@/lib/plan-limits';

// GET: fetch invitations for the current user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const rows = await db.select().from(orgInvitations).where(eq(orgInvitations.targetUid, decoded.uid));
    return NextResponse.json({ invitations: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: accept or reject an invitation
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const { inviteId, action } = await req.json(); // action: 'accept' | 'reject'

    const [invite] = await db.select().from(orgInvitations).where(eq(orgInvitations.id, inviteId)).limit(1);
    if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (invite.targetUid !== decoded.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'accept') {
      const lockCheck = await checkOrgLocked(invite.organizationId);
      if (!lockCheck.allowed) {
        return NextResponse.json({ error: lockCheck.message }, { status: 403 });
      }
      const limitKey = invite.targetRole === 'beneficiary' ? 'maxUsers' : invite.targetRole === 'mentor' || invite.targetRole === 'coach' ? 'maxMentors' : null;
      if (limitKey) {
        const limitCheck = await checkOrgLimit(invite.organizationId, limitKey as 'maxUsers' | 'maxMentors');
        if (!limitCheck.allowed) {
          return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }
      }
    }

    await db.update(orgInvitations).set({ status: action === 'accept' ? 'accepted' : 'rejected' }).where(eq(orgInvitations.id, inviteId));

    let freshToken: string | undefined;
    if (action === 'accept') {
      await db.update(users).set({ organizationId: invite.organizationId }).where(eq(users.id, decoded.uid));
      freshToken = signAuthToken({ uid: decoded.uid, role: decoded.role, organizationId: invite.organizationId });
    }

    // Notify the org admin (not the org id itself — notifications.userId must be a real user)
    const [org] = await db.select().from(organizations).where(eq(organizations.id, invite.organizationId)).limit(1);
    if (org?.adminId) {
      await db.insert(notifications).values({
        id: randomUUID(),
        userId: org.adminId,
        title: action === 'accept' ? 'قبل الدعوة' : 'رفض الدعوة',
        body: `${invite.targetName} ${action === 'accept' ? 'قبل' : 'رفض'} دعوة الانضمام للمنظمة`,
        link: `/organization-dashboard/${invite.targetRole === 'mentor' ? 'mentors' : 'coaches'}`,
        read: false,
      });
    }

    return NextResponse.json({ success: true, token: freshToken });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
