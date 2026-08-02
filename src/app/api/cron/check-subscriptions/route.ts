import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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

// Daily job (called by a scheduled GitHub Action) that:
// - reminds an org's admin once a paid subscription has 30 days or fewer left, once per day
// - locks a subscription once its end date has passed
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const snap = await adminDb.collection('subscriptions').where('status', '==', 'active').get();

  let reminded = 0;
  let locked = 0;

  for (const doc of snap.docs) {
    const sub = doc.data() as any;
    const orgId = sub.orgId || doc.id;
    const endDate = toDate(sub.endDate);
    if (!endDate) continue;

    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      await doc.ref.update({ status: 'locked', lockedAt: now });
      locked++;
      continue;
    }

    if (daysLeft <= 30) {
      const lastReminder = toDate(sub.lastReminderAt);
      if (lastReminder && isSameDay(lastReminder, now)) continue;

      const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
      const adminId = orgSnap.data()?.adminId;
      if (adminId) {
        await adminDb.collection('notifications').add({
          userId: adminId,
          title: 'تذكير بتجديد الاشتراك',
          body: `باقي ${daysLeft} يوم على انتهاء اشتراك منظمتك. يرجى السداد لتفادي إيقاف المنصة.`,
          link: '/organization-dashboard/settings',
          read: false,
          createdAt: now,
        });
      }
      await doc.ref.update({ lastReminderAt: now });
      reminded++;
    }
  }

  return NextResponse.json({ ok: true, checked: snap.size, reminded, locked });
}
