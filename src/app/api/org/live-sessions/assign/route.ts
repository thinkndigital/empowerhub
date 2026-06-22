import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    const orgId = userData.organizationId || (decoded as any).organizationId || '';
    if (!orgId || userData.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { sessionId, beneficiaryIds } = await req.json();
    if (!sessionId || !beneficiaryIds?.length) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const sessionRef = adminDb.collection('live_sessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });

    const regsRef = sessionRef.collection('registrations');
    const batch = adminDb.batch();

    for (const uid of beneficiaryIds) {
      // Get beneficiary info
      const benefSnap = await adminDb.doc(`users/${uid}`).get();
      const benefData = benefSnap.data() || {};

      // Check for duplicate by uid
      const existing = await regsRef.where('beneficiaryUid', '==', uid).get();
      if (!existing.empty) continue;

      const regRef = regsRef.doc();
      batch.set(regRef, {
        beneficiaryUid: uid,
        name: benefData.name || '',
        email: benefData.email || '',
        phone: benefData.phone || '',
        registeredAt: FieldValue.serverTimestamp(),
        paymentStatus: 'free',
        assignedBy: decoded.uid,
        orgId,
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
