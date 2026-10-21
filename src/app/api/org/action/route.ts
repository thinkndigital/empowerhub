import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { users, groups, groupMembers, organizations, orgInvitations, notifications } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAuthToken(token);
    let orgId = decoded.organizationId;
    if (!orgId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    if (action === 'addToOrg') {
      await db.update(users).set({ organizationId: orgId }).where(eq(users.id, body.userId));
      return NextResponse.json({ success: true });
    }

    if (action === 'removeFromOrg') {
      await db.update(users).set({ organizationId: null, groupId: null }).where(eq(users.id, body.userId));
      return NextResponse.json({ success: true });
    }

    if (action === 'createGroup') {
      const id = randomUUID();
      await db.insert(groups).values({ id, organizationId: orgId, name: body.name });
      return NextResponse.json({ success: true, id });
    }

    if (action === 'assignGroup') {
      await db.update(users).set({ groupId: body.groupId }).where(eq(users.id, body.userId));
      await db.insert(groupMembers).values({ groupId: body.groupId, userId: body.userId })
        .onDuplicateKeyUpdate({ set: { userId: body.userId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'invite') {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      const orgName = org?.name || '';
      await db.insert(orgInvitations).values({
        id: randomUUID(),
        organizationId: orgId,
        orgName,
        targetUid: body.targetUid,
        targetName: body.targetName,
        targetRole: body.targetRole,
        status: 'pending',
      });
      await db.insert(notifications).values({
        id: randomUUID(),
        userId: body.targetUid,
        title: 'دعوة من منظمة',
        body: `دعتك منظمة ${orgName} للانضمام إليها`,
        link: `/${body.targetRole}-dashboard/invitations`,
        read: false,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'assignMentor') {
      // body.userId = beneficiary, body.mentorId = mentor's uid
      await db.update(users).set({ mentorId: body.mentorId }).where(eq(users.id, body.userId));
      const [benef] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
      const benefName = benef?.name || 'مستفيد';
      await db.insert(notifications).values({
        id: randomUUID(),
        userId: body.mentorId,
        title: 'تم تعيينك مرشداً',
        body: `تم تعيينك مرشداً للمستفيد ${benefName}`,
        link: '/mentor-dashboard',
        read: false,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'assignCoach') {
      // body.userId = beneficiary, body.coachId = coach's uid
      await db.update(users).set({ coachId: body.coachId }).where(eq(users.id, body.userId));
      const [benef] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
      const benefName = benef?.name || 'مستفيد';
      await db.insert(notifications).values({
        id: randomUUID(),
        userId: body.coachId,
        title: 'تم تعيينك مدرباً',
        body: `تم تعيينك مدرباً للمستفيد ${benefName}`,
        link: '/coach-dashboard',
        read: false,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
