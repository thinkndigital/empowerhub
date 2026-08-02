import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

function normalizeDate(date: any): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  const s = date._seconds ?? date.seconds;
  return s ? new Date(s * 1000).toISOString() : undefined;
}

async function resolveOrgId(token: string): Promise<string | null> {
  const decoded = await adminAuth.verifyIdToken(token);
  let orgId = (decoded as any).organizationId as string | undefined;
  if (!orgId) {
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    orgId = userDoc.data()?.organizationId;
  }
  return orgId || null;
}

// Returns the org's current plan (name/price, free or paid) and subscription status
// (days remaining, renewal date) for display on the org settings page, plus the list
// of other paid plans it could upgrade to.
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const orgId = await resolveOrgId(token);
    if (!orgId) return NextResponse.json({ error: 'ليس مدير منظمة' }, { status: 403 });

    const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
    const planKey = orgSnap.data()?.plan;

    const [plansSnap, subSnap] = await Promise.all([
      adminDb.collection('plans').orderBy('order').get(),
      adminDb.collection('subscriptions').doc(orgId).get(),
    ]);

    const allPlans = plansSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        key: data.key || d.id,
        name: data.name || '',
        priceMonthly: data.priceMonthly ?? 0,
        currency: data.currency || 'JOD',
        features: data.features || [],
      };
    });

    const currentPlan = allPlans.find(p => p.key === planKey) || null;
    const isFree = !currentPlan || currentPlan.priceMonthly <= 0;

    const sub = subSnap.exists ? subSnap.data() : null;
    let daysLeft: number | null = null;
    const endDate = normalizeDate(sub?.endDate);
    if (endDate) {
      daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      orgId,
      isFree,
      currentPlan,
      status: sub?.status || (isFree ? 'active' : null),
      endDate,
      daysLeft,
      upgradablePlans: allPlans.filter(p => p.priceMonthly > 0 && p.key !== planKey),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
