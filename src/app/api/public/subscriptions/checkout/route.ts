import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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

    const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';

    const [orgSnap, planSnap] = await Promise.all([
      adminDb.collection('organizations').doc(orgId).get(),
      adminDb.collection('plans').doc(planId).get(),
    ]);

    if (!orgSnap.exists) return NextResponse.json({ error: 'المنظمة غير موجودة' }, { status: 404 });
    if (!planSnap.exists) return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });

    const planData = planSnap.data() as any;
    const amount = cycle === 'annual' ? (planData.priceAnnual || 0) : (planData.priceMonthly || 0);
    if (amount <= 0) return NextResponse.json({ error: 'هذه الخطة لا تتطلب دفعاً' }, { status: 400 });

    const orderRef = await adminDb.collection('orders').add({
      type: 'subscription',
      orgId,
      planId,
      planKey: planData.key || planId,
      planName: planData.name || '',
      billingCycle: cycle,
      totalAmount: amount,
      currency: planData.currency || 'JOD',
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, orderId: orderRef.id, amount, currency: planData.currency || 'JOD' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
