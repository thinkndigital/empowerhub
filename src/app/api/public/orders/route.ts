import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';

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
      type, courseId, userId,
    } = body;

    if (!productId || !buyerName || !buyerPhone) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(orders).values({
      id,
      type: type || 'product',
      courseId: courseId || null,
      userId: userId || beneficiaryId || null,
      productId,
      productName: productName || '',
      storeId: storeId || null,
      storeName: storeName || '',
      organizationId: organizationId || null,
      buyerName,
      buyerPhone,
      buyerAddress: buyerAddress || '',
      notes: notes || '',
      quantity,
      totalAmount: String((productPrice || 0) * quantity),
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'unpaid',
      status: 'pending',
    });

    return NextResponse.json({ ok: true, orderId: id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
