import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { notifySeller } from '@/lib/notify-seller';

export const dynamic = 'force-dynamic';

interface CartLineItem {
  productId: string;
  productName: string;
  productPrice: number;
  deliveryCost?: number;
  storeId?: string;
  storeName?: string;
  beneficiaryId: string;
  organizationId?: string;
  quantity?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items, buyerName, buyerPhone, buyerAddress, notes, paymentMethod,
    }: { items: CartLineItem[]; buyerName: string; buyerPhone: string; buyerAddress?: string; notes?: string; paymentMethod?: string } = body;

    if (!Array.isArray(items) || items.length === 0 || !buyerName || !buyerPhone) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const orderIds: string[] = [];
    let total = 0;

    for (const item of items) {
      if (!item.productId || !item.beneficiaryId) continue;
      const quantity = item.quantity || 1;
      const deliveryCost = item.deliveryCost || 0;
      const lineTotal = (item.productPrice || 0) * quantity + deliveryCost;
      total += lineTotal;

      const orderRef = await adminDb.collection('orders').add({
        type: 'product',
        productId: item.productId,
        productName: item.productName || '',
        productPrice: item.productPrice || 0,
        storeId: item.storeId || '',
        storeName: item.storeName || '',
        beneficiaryId: item.beneficiaryId,
        organizationId: item.organizationId || '',
        buyerName,
        buyerPhone,
        buyerAddress: buyerAddress || '',
        notes: notes || '',
        quantity,
        deliveryCost,
        totalAmount: lineTotal,
        paymentMethod: paymentMethod || 'cod',
        paymentStatus: 'unpaid',
        status: 'pending',
        createdAt: new Date(),
      });
      orderIds.push(orderRef.id);
      await notifySeller(item.beneficiaryId, item.productName || 'منتجك', orderRef.id);
    }

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'لا توجد منتجات صالحة في السلة' }, { status: 400 });
    }

    if (!paymentMethod || paymentMethod === 'cod') {
      return NextResponse.json({ ok: true, orderIds, total });
    }

    // Online payment: one combined charge for the whole cart. A lightweight
    // "batch" order coordinates the real per-product orders above so the
    // existing single-orderId payment/initiate + verify flow needs no
    // changes — it just treats this batch doc like any other order.
    const batchRef = await adminDb.collection('orders').add({
      type: 'cart-batch',
      orderIds,
      totalAmount: total,
      buyerName,
      buyerPhone,
      paymentMethod,
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, orderIds, batchOrderId: batchRef.id, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
