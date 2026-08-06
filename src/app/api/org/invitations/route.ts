import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkOrgLimit, checkOrgLocked } from '@/lib/plan-limits';
import { notifyUser } from '@/lib/notify';

// GET: fetch invitations for the current user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const snap = await adminDb.collection('orgInvitations')
      .where('targetUid', '==', decoded.uid)
      .get();

    const invitations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ invitations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: accept or reject an invitation
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const { inviteId, action } = await req.json(); // action: 'accept' | 'reject'

    const inviteRef = adminDb.collection('orgInvitations').doc(inviteId);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const invite = inviteSnap.data()!;
    if (invite.targetUid !== decoded.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'accept') {
      const lockCheck = await checkOrgLocked(invite.orgId);
      if (!lockCheck.allowed) {
        return NextResponse.json({ error: lockCheck.message }, { status: 403 });
      }
      const limitKey = invite.targetRole === 'beneficiary' ? 'maxUsers' : invite.targetRole === 'mentor' || invite.targetRole === 'coach' ? 'maxMentors' : null;
      if (limitKey) {
        const limitCheck = await checkOrgLimit(invite.orgId, limitKey);
        if (!limitCheck.allowed) {
          return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }
      }
    }

    await inviteRef.update({ status: action === 'accept' ? 'accepted' : 'rejected' });

    if (action === 'accept') {
      // Link user to org
      await adminDb.collection('users').doc(decoded.uid).update({
        organizationId: invite.orgId,
      });
      // Update custom claims
      const currentUser = await adminAuth.getUser(decoded.uid);
      const claims = currentUser.customClaims || {};
      await adminAuth.setCustomUserClaims(decoded.uid, { ...claims, organizationId: invite.orgId });
    }

    // Notify the org admin
    const orgAdminSnap = await adminDb.collection('users')
      .where('organizationId', '==', invite.orgId)
      .where('role', '==', 'organization')
      .limit(1).get();
    const orgAdminUid = orgAdminSnap.docs[0]?.id;
    if (orgAdminUid) {
      const inviteBody = `${invite.targetName} ${action === 'accept' ? 'قبل' : 'رفض'} دعوة الانضمام للمنظمة`;
      await notifyUser({
        uid: orgAdminUid,
        type: 'org_invitation',
        title: action === 'accept' ? 'قبل الدعوة' : 'رفض الدعوة',
        body: inviteBody,
        link: `/organization-dashboard/${invite.targetRole === 'mentor' ? 'mentors' : 'coaches'}`,
        email: { subject: action === 'accept' ? 'قبل الدعوة' : 'رفض الدعوة', bodyHtml: inviteBody },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
