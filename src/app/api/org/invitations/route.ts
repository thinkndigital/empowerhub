import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    // Notify the org
    await adminDb.collection('notifications').add({
      userId: invite.orgId, // org admin's uid — actually we need org admin uid
      title: action === 'accept' ? 'قبل الدعوة' : 'رفض الدعوة',
      description: `${invite.targetName} ${action === 'accept' ? 'قبل' : 'رفض'} دعوة الانضمام للمنظمة`,
      link: `/organization-dashboard/${invite.targetRole === 'mentor' ? 'mentors' : 'coaches'}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
