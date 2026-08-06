import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value._seconds || value.seconds) return new Date((value._seconds ?? value.seconds) * 1000);
  if (typeof value === 'string') return new Date(value);
  return null;
}

// Daily job (called by a scheduled GitHub Action) that, for every "active" (paid) or
// "trial" (free, 30-day) subscription not marked permanentFree by an admin:
// - reminds the org's admin once it has 30 days or fewer left, once per day
// - expires it once its end date has passed
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const snap = await adminDb.collection('subscriptions').where('status', 'in', ['active', 'trial']).get();

  let reminded = 0;
  let expired = 0;

  for (const doc of snap.docs) {
    const sub = doc.data() as any;
    if (sub.permanentFree) continue;

    const orgId = sub.orgId || doc.id;
    const endDate = toDate(sub.endDate);
    if (!endDate) continue;

    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isTrial = sub.status === 'trial';

    if (daysLeft <= 0) {
      await doc.ref.update({ status: 'expired', expiredAt: now });
      expired++;
      const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
      const adminId = orgSnap.data()?.adminId;
      if (adminId) {
        const expiredBody = 'انتهى اشتراك منظمتك وتم قفل الوصول للوحة التحكم لحد ما يتم تجديد الاشتراك.';
        await notifyUser({
          uid: adminId,
          type: 'subscription_expired',
          title: 'انتهى اشتراك منظمتك',
          body: expiredBody,
          link: '/payment',
          email: { subject: 'انتهى اشتراك منظمتك', bodyHtml: expiredBody, ctaText: 'تجديد الاشتراك', ctaLink: `${SITE_URL}/payment` },
        });
      }
      continue;
    }

    if (daysLeft <= 30) {
      const lastReminder = toDate(sub.lastReminderAt);
      if (lastReminder && isSameDay(lastReminder, now)) continue;

      const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
      const adminId = orgSnap.data()?.adminId;
      if (adminId) {
        const reminderTitle = isTrial ? 'تذكير بانتهاء الفترة التجريبية المجانية' : 'تذكير بتجديد الاشتراك';
        const reminderBody = isTrial
          ? `باقي ${daysLeft} يوم على انتهاء الفترة التجريبية المجانية لمنظمتك. اشترك بخطة مدفوعة لتفادي إيقاف إضافة أعضاء جدد.`
          : `باقي ${daysLeft} يوم على انتهاء اشتراك منظمتك. يرجى السداد لتفادي إيقاف إضافة أعضاء جدد.`;
        await notifyUser({
          uid: adminId,
          type: 'subscription_reminder',
          title: reminderTitle,
          body: reminderBody,
          link: '/organization-dashboard/settings',
          email: { subject: reminderTitle, bodyHtml: reminderBody, ctaText: 'الذهاب للاشتراك', ctaLink: `${SITE_URL}/organization-dashboard/settings` },
        });
      }
      await doc.ref.update({ lastReminderAt: now });
      reminded++;
    }
  }

  return NextResponse.json({ ok: true, checked: snap.size, reminded, expired });
}
