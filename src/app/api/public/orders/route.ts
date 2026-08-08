import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

const ORDERS_LINK_BY_ROLE: Record<string, string> = {
  coach: '/coach-dashboard/orders',
  mentor: '/mentor-dashboard/orders',
  organization: '/organization-dashboard/orders',
};

// Notifies the seller (course owner for course orders, store owner for
// product orders) that a new order came in — best-effort, never throws.
async function notifySeller(sellerUid: string, productLabel: string, orderId: string) {
  try {
    const sellerDoc = await adminDb.collection('users').doc(sellerUid).get();
    const sellerRole = sellerDoc.data()?.role;
    const link = ORDERS_LINK_BY_ROLE[sellerRole] || '/dashboard/my-store';
    const body = `لديك طلب جديد على "${productLabel}". راجع لوحة التحكم لمتابعته.`;
    await notifyUser({
      uid: sellerUid,
      type: 'new_order',
      title: 'طلب جديد',
      body,
      link,
      email: {
        subject: 'لديك طلب جديد',
        bodyHtml: body,
        ctaText: 'عرض الطلب',
        ctaLink: `${SITE_URL}${link}`,
      },
    });
  } catch (e: any) {
    console.error(`[orders] failed to notify seller uid=${sellerUid} order=${orderId}:`, e?.message || e);
  }
}

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
      totalAmount: (productPrice || 0) * quantity,
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
