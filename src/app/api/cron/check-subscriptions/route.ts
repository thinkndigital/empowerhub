import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { subscriptions, organizations, notifications } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
  const subs = await db.select().from(subscriptions).where(inArray(subscriptions.status, ['active', 'trial']));

  let reminded = 0;
  let expired = 0;

  for (const sub of subs) {
    if (sub.permanentFree) continue;

    const orgId = sub.organizationId;
    const endDate = sub.endDate ? new Date(sub.endDate) : null;
    if (!endDate) continue;

    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isTrial = sub.status === 'trial';

    if (daysLeft <= 0) {
      await db.update(subscriptions).set({ status: 'expired', expiredAt: now }).where(eq(subscriptions.organizationId, orgId));
      expired++;
      continue;
    }

    if (daysLeft <= 30) {
      const lastReminder = sub.lastReminderAt ? new Date(sub.lastReminderAt) : null;
      if (lastReminder && isSameDay(lastReminder, now)) continue;

      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      if (org?.adminId) {
        await db.insert(notifications).values({
          id: randomUUID(),
          userId: org.adminId,
          title: isTrial ? 'تذكير بانتهاء الفترة التجريبية المجانية' : 'تذكير بتجديد الاشتراك',
          body: isTrial
            ? `باقي ${daysLeft} يوم على انتهاء الفترة التجريبية المجانية لمنظمتك. اشترك بخطة مدفوعة لتفادي إيقاف إضافة أعضاء جدد.`
            : `باقي ${daysLeft} يوم على انتهاء اشتراك منظمتك. يرجى السداد لتفادي إيقاف إضافة أعضاء جدد.`,
          link: '/organization-dashboard/settings',
          read: false,
        });
      }
      await db.update(subscriptions).set({ lastReminderAt: now }).where(eq(subscriptions.organizationId, orgId));
      reminded++;
    }
  }

  return NextResponse.json({ ok: true, checked: subs.length, reminded, expired });
}
