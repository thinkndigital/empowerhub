import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentStatus, status } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    await adminDb.collection('orders').doc(orderId).update({
      paymentStatus: paymentStatus || 'paid',
      status: status || 'confirmed',
      paidAt: new Date(),
    });

    // Return order data so the client can check type/courseId
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    const orderData = orderDoc.exists ? orderDoc.data() : null;

    if (orderData?.type === 'subscription' && orderData.orgId && orderData.planId) {
      const now = new Date();
      const endDate = new Date(now);
      if (orderData.billingCycle === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);

      await adminDb.collection('subscriptions').doc(orderData.orgId).set({
        orgId: orderData.orgId,
        planId: orderData.planId,
        planKey: orderData.planKey || orderData.planId,
        planName: orderData.planName || '',
        billingCycle: orderData.billingCycle || 'monthly',
        status: 'active',
        startDate: now,
        endDate,
        renewalDate: endDate,
        lastReminderAt: null,
        lastPaymentId: orderId,
        updatedAt: now,
      }, { merge: true });

      await adminDb.collection('organizations').doc(orderData.orgId).update({
        plan: orderData.planKey || orderData.planId,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      order: orderData
        ? {
            type: orderData.type || 'product',
            courseId: orderData.courseId || '',
            userId: orderData.userId || '',
            orgId: orderData.orgId || '',
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
