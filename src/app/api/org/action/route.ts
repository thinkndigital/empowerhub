import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = decoded.organizationId as string | undefined;
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    if (action === 'addToOrg') {
      await adminDb.collection('users').doc(body.userId).update({ organizationId: orgId });
      return NextResponse.json({ success: true });
    }

    if (action === 'removeFromOrg') {
      await adminDb.collection('users').doc(body.userId).update({
        organizationId: FieldValue.delete(),
        groupId: FieldValue.delete(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'createGroup') {
      const ref = await adminDb.collection('groups').add({
        orgId, name: body.name, memberIds: [], createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, id: ref.id });
    }

    if (action === 'assignGroup') {
      await adminDb.collection('users').doc(body.userId).update({ groupId: body.groupId });
      await adminDb.collection('groups').doc(body.groupId).update({
        memberIds: FieldValue.arrayUnion(body.userId),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'invite') {
      const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
      const orgName = orgSnap.data()?.name || '';
      await adminDb.collection('orgInvitations').add({
        orgId,
        orgName,
        targetUid: body.targetUid,
        targetName: body.targetName,
        targetRole: body.targetRole,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      await adminDb.collection('notifications').add({
        userId: body.targetUid,
        title: 'دعوة من منظمة',
        description: `دعتك منظمة ${orgName} للانضمام إليها`,
        link: `/${body.targetRole}-dashboard/invitations`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'assignMentor') {
      // body.userId = beneficiary, body.mentorId = mentor's uid
      await adminDb.collection('users').doc(body.userId).update({ mentorId: body.mentorId });
      // Notify mentor
      const benefSnap = await adminDb.collection('users').doc(body.userId).get();
      const benefName = benefSnap.data()?.name || 'مستفيد';
      await adminDb.collection('notifications').add({
        userId: body.mentorId,
        title: 'تم تعيينك مرشداً',
        description: `تم تعيينك مرشداً للمستفيد ${benefName}`,
        link: '/mentor-dashboard',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'assignCoach') {
      // body.userId = beneficiary, body.coachId = coach's uid
      await adminDb.collection('users').doc(body.userId).update({ coachId: body.coachId });
      const benefSnap2 = await adminDb.collection('users').doc(body.userId).get();
      const benefName2 = benefSnap2.data()?.name || 'مستفيد';
      await adminDb.collection('notifications').add({
        userId: body.coachId,
        title: 'تم تعيينك مدرباً',
        description: `تم تعيينك مدرباً للمستفيد ${benefName2}`,
        link: '/coach-dashboard',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
