import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hostId, hostName, hostRole, sessionPrice, buyerName, buyerPhone, preferredTime, notes, paymentMethod } = body;

    if (!hostId || !buyerName?.trim() || !buyerPhone?.trim() || !sessionPrice) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const sessionType = hostRole === 'coach' ? 'تدريب' : 'إرشاد';
    const order = {
      type: 'session',
      productId: hostId,
      productName: `جلسة ${sessionType} مع ${hostName}`,
      productPrice: Number(sessionPrice),
      storeId: '',
      storeName: '',
      beneficiaryId: hostId,
      organizationId: '',
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerAddress: '',
      notes: notes || '',
      preferredTime: preferredTime || '',
      quantity: 1,
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
      paymentStatus: 'unpaid',
      hostId,
      hostName,
      hostRole: hostRole || 'mentor',
      createdAt: new Date().toISOString(),
    };

    const ref = await adminDb.collection('orders').add(order);

    const link = hostRole === 'coach' ? '/coach-dashboard/orders' : '/mentor-dashboard/orders';
    const notifBody = `لديك طلب حجز جلسة ${sessionType} جديد من ${buyerName.trim()}.`;
    notifyUser({
      uid: hostId,
      type: 'new_order',
      title: 'طلب حجز جلسة جديد',
      body: notifBody,
      link,
      email: {
        subject: 'طلب حجز جلسة جديد',
        bodyHtml: notifBody,
        ctaText: 'عرض الطلب',
        ctaLink: `${SITE_URL}${link}`,
      },
    }).catch((e: any) => console.error(`[sessions/book] failed to notify host uid=${hostId}:`, e?.message || e));

    return NextResponse.json({ ok: true, orderId: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
