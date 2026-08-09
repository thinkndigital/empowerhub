import { adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

const ORDERS_LINK_BY_ROLE: Record<string, string> = {
  coach: '/coach-dashboard/orders',
  mentor: '/mentor-dashboard/orders',
  organization: '/organization-dashboard/orders',
};

// Notifies the seller (course owner for course orders, store owner for
// product orders) that a new order came in — best-effort, never throws.
export async function notifySeller(sellerUid: string, productLabel: string, orderId: string) {
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
