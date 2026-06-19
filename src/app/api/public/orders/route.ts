import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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
    } = body;

    if (!productId || !buyerName || !buyerPhone) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const orderRef = await adminDb.collection('orders').add({
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
      totalAmount: (productPrice || 0) * quantity,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, orderId: orderRef.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
