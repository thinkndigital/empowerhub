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

    return NextResponse.json({
      ok: true,
      order: orderData
        ? {
            type: orderData.type || 'product',
            courseId: orderData.courseId || '',
            userId: orderData.userId || '',
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
