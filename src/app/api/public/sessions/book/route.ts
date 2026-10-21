import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hostId, hostName, hostRole, sessionPrice, buyerName, buyerPhone, preferredTime, notes, paymentMethod } = body;

    if (!hostId || !buyerName?.trim() || !buyerPhone?.trim() || !sessionPrice) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const sessionType = hostRole === 'coach' ? 'تدريب' : 'إرشاد';
    const orderId = randomUUID();
    await db.insert(orders).values({
      id: orderId,
      type: 'session',
      productId: hostId,
      productName: `جلسة ${sessionType} مع ${hostName}`,
      totalAmount: String(Number(sessionPrice)),
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      notes: notes || '',
      preferredTime: preferredTime || '',
      quantity: 1,
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'cod' : 'unpaid',
      hostId,
      hostName,
      hostRole: hostRole || 'mentor',
    });

    return NextResponse.json({ ok: true, orderId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
