import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// Tells any member of an organization (admin, beneficiary, mentor, coach, team)
// whether their organization's paid subscription is locked (expired, unpaid).
// Orgs with no plan, or a free plan, or no subscription doc at all are never locked.
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    let organizationId = decoded.organizationId as string | undefined;
    let isAdmin = false;

    if (!organizationId) {
      const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
      organizationId = userSnap.data()?.organizationId;
    }

    if (!organizationId) {
      return NextResponse.json({ locked: false });
    }

    const orgSnap = await adminDb.collection('organizations').doc(organizationId).get();
    isAdmin = orgSnap.data()?.adminId === decoded.uid;
    const planKey = orgSnap.data()?.plan || '';

    const subSnap = await adminDb.collection('subscriptions').doc(organizationId).get();
    if (!subSnap.exists) {
      return NextResponse.json({ locked: false });
    }

    const sub = subSnap.data() as any;
    const locked = sub.status === 'locked';

    return NextResponse.json({
      locked,
      orgId: organizationId,
      planKey,
      isAdmin,
    });
  } catch (e: any) {
    return NextResponse.json({ locked: false });
  }
}
