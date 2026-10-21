import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations, plans, subscriptions, users } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

async function resolveOrgId(token: string): Promise<string | null> {
  const decoded = await verifyAuthToken(token);
  let orgId = decoded.organizationId;
  if (!orgId) {
    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    orgId = userRow?.organizationId;
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

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const planKey = org?.planKey;

    const [allPlanRows, [sub]] = await Promise.all([
      db.select().from(plans).orderBy(asc(plans.sortOrder)),
      db.select().from(subscriptions).where(eq(subscriptions.organizationId, orgId)).limit(1),
    ]);

    const allPlans = allPlanRows.map(p => ({
      id: p.id,
      key: p.key,
      name: p.name || '',
      priceMonthly: Number(p.priceMonthly ?? 0),
      currency: p.currency || 'JOD',
      features: p.features || [],
    }));

    const currentPlan = allPlans.find(p => p.key === planKey) || null;
    const isFree = !currentPlan || currentPlan.priceMonthly <= 0;

    let daysLeft: number | null = null;
    const endDate = sub?.endDate ? new Date(sub.endDate).toISOString() : undefined;
    if (endDate) {
      daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      orgId,
      isFree,
      currentPlan,
      status: sub?.status || (isFree ? 'trial' : null),
      billingCycle: sub?.billingCycle || 'monthly',
      startDate: sub?.startDate ? new Date(sub.startDate).toISOString() : undefined,
      endDate,
      daysLeft,
      permanentFree: !!sub?.permanentFree,
      upgradablePlans: allPlans.filter(p => p.priceMonthly > 0 && p.key !== planKey),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
