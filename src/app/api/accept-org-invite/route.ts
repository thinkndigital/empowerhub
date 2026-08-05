import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkOrgLimit, checkOrgLocked } from '@/lib/plan-limits';
import { recordOrgMembershipChange } from '@/lib/org-history';

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, uid, email } = await req.json();
    if (!inviteCode || !uid) {
      return NextResponse.json({ error: 'inviteCode and uid are required' }, { status: 400 });
    }

    const orgsSnapshot = await adminDb
      .collection('organizations')
      .where('inviteCode', '==', inviteCode.trim().toUpperCase())
      .limit(1)
      .get();

    if (orgsSnapshot.empty) {
      return NextResponse.json({ error: 'كود الدعوة غير صحيح' }, { status: 404 });
    }

    const orgDoc = orgsSnapshot.docs[0];
    const organizationId = orgDoc.id;

    const lockCheck = await checkOrgLocked(organizationId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: lockCheck.message }, { status: 403 });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const role = userSnap.data()?.role;
    const limitKey = role === 'beneficiary' ? 'maxUsers' : role === 'mentor' || role === 'coach' ? 'maxMentors' : null;
    if (limitKey) {
      const limitCheck = await checkOrgLimit(organizationId, limitKey);
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.message }, { status: 403 });
      }
    }

    await Promise.all([
      adminDb.collection('users').doc(uid).set({ organizationId }, { merge: true }),
      adminAuth.setCustomUserClaims(uid, { organizationId }).catch(() => {}),
      recordOrgMembershipChange(uid, organizationId),
    ]);

    return NextResponse.json({ success: true, organizationId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
