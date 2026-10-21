import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, subscriptions, organizations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentStatus, status } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    await db.update(orders).set({
      paymentStatus: paymentStatus || 'paid',
      status: status || 'confirmed',
      confirmedAt: new Date(),
    }).where(eq(orders.id, orderId));

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (order?.type === 'subscription' && order.organizationId && order.planId) {
      const now = new Date();
      const endDate = new Date(now);
      const billingCycle: 'monthly' | 'annual' = order.billingCycle === 'annual' ? 'annual' : 'monthly';
      if (billingCycle === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);

      await db.insert(subscriptions).values({
        organizationId: order.organizationId,
        planId: order.planId,
        planKey: order.planKey || order.planId,
        planName: order.planName || '',
        billingCycle,
        status: 'active',
        startDate: now,
        endDate,
        renewalDate: endDate,
        lastReminderAt: null,
        lastPaymentId: orderId,
      }).onDuplicateKeyUpdate({
        set: {
          planId: order.planId,
          planKey: order.planKey || order.planId,
          planName: order.planName || '',
          billingCycle,
          status: 'active',
          startDate: now,
          endDate,
          renewalDate: endDate,
          lastReminderAt: null,
          lastPaymentId: orderId,
        },
      });

      await db.update(organizations).set({ planKey: order.planKey || order.planId }).where(eq(organizations.id, order.organizationId)).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      order: order
        ? {
            type: order.type || 'product',
            courseId: order.courseId || '',
            userId: order.userId || '',
            orgId: order.organizationId || '',
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
