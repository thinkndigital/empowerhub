import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    await Promise.all([
      adminDb.collection('users').doc(uid).set({ organizationId }, { merge: true }),
      adminAuth.setCustomUserClaims(uid, { organizationId }).catch(() => {}),
    ]);

    return NextResponse.json({ success: true, organizationId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
