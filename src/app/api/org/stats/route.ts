import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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

    const [benefSnap, mentorSnap, coachSnap] = await Promise.all([
      adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'beneficiary').get(),
      adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'mentor').get(),
      adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'coach').get(),
    ]);

    const beneficiaries = benefSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const avgProgress = beneficiaries.length > 0
      ? Math.round(beneficiaries.reduce((s: number, b: any) => s + (b.progress || 0), 0) / beneficiaries.length)
      : 0;

    return NextResponse.json({
      beneficiariesCount: benefSnap.size,
      mentorsCount: mentorSnap.size,
      coachesCount: coachSnap.size,
      avgProgress,
      recentBeneficiaries: beneficiaries.slice(0, 5),
      beneficiaries,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
