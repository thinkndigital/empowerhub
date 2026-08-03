import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { checkOrgLocked } from '@/lib/plan-limits';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    if (!orgId) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      orgId = userDoc.data()?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const lockCheck = await checkOrgLocked(orgId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: 'التقارير ميزة مدفوعة — يرجى الاشتراك أو التجديد لعرضها.' }, { status: 403 });
    }

    const [benefSnap, mentorSnap, sessionSnap] = await Promise.all([
      adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'beneficiary').get(),
      adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'mentor').get(),
      adminDb.collection('sessions').where('organizationId', '==', orgId).get(),
    ]);

    const beneficiaries = benefSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const sessions = sessionSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    return NextResponse.json({
      beneficiaries,
      mentorsCount: mentorSnap.size,
      sessions,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
