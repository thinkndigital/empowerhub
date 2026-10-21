import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations, plans, orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// Creates an `orders`-shaped record for an organization subscription payment,
// reusing the existing generic payment/initiate + orders/verify pipeline.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, planId, billingCycle } = body;

    if (!orgId || !planId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const cycle: 'monthly' | 'annual' = billingCycle === 'annual' ? 'annual' : 'monthly';

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);

    if (!org) return NextResponse.json({ error: 'المنظمة غير موجودة' }, { status: 404 });
    if (!plan) return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });

    const amount = cycle === 'annual' ? Number(plan.priceAnnual || 0) : Number(plan.priceMonthly || 0);
    if (amount <= 0) return NextResponse.json({ error: 'هذه الخطة لا تتطلب دفعاً' }, { status: 400 });

    const orderId = randomUUID();
    await db.insert(orders).values({
      id: orderId,
      type: 'subscription',
      organizationId: orgId,
      planId,
      planKey: plan.key || planId,
      planName: plan.name || '',
      billingCycle: cycle,
      totalAmount: String(amount),
      currency: plan.currency || 'JOD',
      paymentStatus: 'unpaid',
      status: 'pending',
    });

    return NextResponse.json({ ok: true, orderId, amount, currency: plan.currency || 'JOD' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
