import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { notifySeller } from '@/lib/notify-seller';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId, productName, productPrice, storeId, storeName,
      beneficiaryId, organizationId,
      buyerName, buyerPhone, buyerAddress, notes,
      paymentMethod, // 'cod' | 'online'
      quantity = 1,
      deliveryCost = 0,
    } = body;

    if (!productId || !buyerName || !buyerPhone) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const { type, courseId, userId } = body;

    const orderRef = await adminDb.collection('orders').add({
      type: type || 'product',
      courseId: courseId || '',
      userId: userId || beneficiaryId || '',
      productId,
      productName: productName || '',
      productPrice: productPrice || 0,
      storeId: storeId || '',
      storeName: storeName || '',
      beneficiaryId: beneficiaryId || '',
      organizationId: organizationId || '',
      buyerName,
      buyerPhone,
      buyerAddress: buyerAddress || '',
      notes: notes || '',
      quantity,
      deliveryCost: deliveryCost || 0,
      totalAmount: (productPrice || 0) * quantity + (deliveryCost || 0),
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: new Date(),
    });

    // Notify the seller. For course orders `beneficiaryId` is the buyer, so
    // the seller is resolved from the course's `createdBy` field instead.
    if (type === 'course' && courseId) {
      const courseDoc = await adminDb.collection('courses').doc(courseId).get();
      const sellerUid = courseDoc.data()?.createdBy;
      if (sellerUid) await notifySeller(sellerUid, productName || 'دورتك', orderRef.id);
    } else if (beneficiaryId) {
      await notifySeller(beneficiaryId, productName || 'منتجك', orderRef.id);
    }

    return NextResponse.json({ ok: true, orderId: orderRef.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
