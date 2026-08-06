import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { recordOrgMembershipChange } from '@/lib/org-history';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    if (!orgId) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      orgId = userDoc.data()?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    if (action === 'addToOrg') {
      await adminDb.collection('users').doc(body.userId).update({ organizationId: orgId });
      await recordOrgMembershipChange(body.userId, orgId);
      return NextResponse.json({ success: true });
    }

    if (action === 'removeFromOrg') {
      const removedUserSnap = await adminDb.collection('users').doc(body.userId).get();
      const removedUser = removedUserSnap.data() || {};
      const orgSnapForRemoval = await adminDb.collection('organizations').doc(orgId).get();
      const removalOrgName = orgSnapForRemoval.data()?.name || '';

      await adminDb.collection('users').doc(body.userId).update({
        organizationId: FieldValue.delete(),
        groupId: FieldValue.delete(),
      });
      await recordOrgMembershipChange(body.userId, null);

      const removalBody = `تمت إزالتك من منظمة ${removalOrgName}. لم يعد بإمكانك الوصول إلى بيانات ولوحة تحكم هذه المنظمة.`;
      await notifyUser({
        uid: body.userId,
        type: 'org_removal',
        title: 'تمت إزالتك من المنظمة',
        body: removalBody,
        link: `/${removedUser.role || 'dashboard'}-dashboard`,
        email: { subject: 'تمت إزالتك من المنظمة', bodyHtml: removalBody },
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
      const inviteEmailBody = `دعتك منظمة ${orgName} للانضمام إليها`;
      await notifyUser({
        uid: body.targetUid,
        type: 'org_invitation',
        title: 'دعوة من منظمة',
        body: inviteEmailBody,
        link: `/${body.targetRole}-dashboard/invitations`,
        email: { subject: 'دعوة انضمام لمنظمة', bodyHtml: inviteEmailBody, ctaText: 'عرض الدعوة', ctaLink: `${SITE_URL}/${body.targetRole}-dashboard/invitations` },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'assignMentor') {
      // body.userId = beneficiary, body.mentorId = mentor's uid
      await adminDb.collection('users').doc(body.userId).update({ mentorId: body.mentorId });
      // Notify mentor
      const benefSnap = await adminDb.collection('users').doc(body.userId).get();
      const benefName = benefSnap.data()?.name || 'مستفيد';
      const assignMentorBody = `تم تعيينك مرشداً للمستفيد ${benefName}`;
      await notifyUser({
        uid: body.mentorId,
        type: 'assignment',
        title: 'تم تعيينك مرشداً',
        body: assignMentorBody,
        link: '/mentor-dashboard',
        email: { subject: 'تم تعيينك مرشداً', bodyHtml: assignMentorBody },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'assignCoach') {
      // body.userId = beneficiary, body.coachId = coach's uid
      await adminDb.collection('users').doc(body.userId).update({ coachId: body.coachId });
      const benefSnap2 = await adminDb.collection('users').doc(body.userId).get();
      const benefName2 = benefSnap2.data()?.name || 'مستفيد';
      const assignCoachBody = `تم تعيينك مدرباً للمستفيد ${benefName2}`;
      await notifyUser({
        uid: body.coachId,
        type: 'assignment',
        title: 'تم تعيينك مدرباً',
        body: assignCoachBody,
        link: '/coach-dashboard',
        email: { subject: 'تم تعيينك مدرباً', bodyHtml: assignCoachBody },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
