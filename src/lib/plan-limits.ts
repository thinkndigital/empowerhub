import { db } from '@/lib/db';
import { organizations, plans, subscriptions, users } from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';

type LimitKey = 'maxUsers' | 'maxMentors';

const LIMIT_LABELS: Record<LimitKey, string> = {
  maxUsers: 'المستفيدين',
  maxMentors: 'المرشدين والمدربين',
};

export type LimitCheckResult = { allowed: true } | { allowed: false; message: string };

// Checks whether an organization can add one more beneficiary/mentor/coach under its current
// plan. Coaches, mentors, and beneficiaries are otherwise unaffected by the plan — this only
// gates the org's "add member" actions, never their own content (courses, sessions, products).
// Orgs with no plan set, or a plan/limit that can't be resolved, are treated as unrestricted
// (keeps legacy organizations working exactly as before this feature existed).
export async function checkOrgLimit(orgId: string | undefined | null, limitKey: LimitKey): Promise<LimitCheckResult> {
  if (!orgId) return { allowed: true };

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

  // An admin can override a specific org's limit (e.g. to grant it more capacity
  // than its plan normally allows) independent of which plan it's on.
  const override = limitKey === 'maxUsers' ? org?.maxUsersOverride : org?.maxMentorsOverride;

  let max: number | null | undefined = override;
  if (max == null) {
    const planKey = org?.planKey;
    if (!planKey) return { allowed: true };

    const [plan] = await db.select().from(plans).where(eq(plans.key, planKey)).limit(1);
    if (!plan) return { allowed: true };
    max = limitKey === 'maxUsers' ? plan.maxUsers : plan.maxMentors;
  }
  if (max == null || max === -1) return { allowed: true };

  let current = 0;
  if (limitKey === 'maxUsers') {
    const [row] = await db.select({ c: count() }).from(users)
      .where(and(eq(users.organizationId, orgId), eq(users.role, 'beneficiary')));
    current = row?.c ?? 0;
  } else {
    const [mentorsRow] = await db.select({ c: count() }).from(users)
      .where(and(eq(users.organizationId, orgId), eq(users.role, 'mentor')));
    const [coachesRow] = await db.select({ c: count() }).from(users)
      .where(and(eq(users.organizationId, orgId), eq(users.role, 'coach')));
    current = (mentorsRow?.c ?? 0) + (coachesRow?.c ?? 0);
  }

  if (current >= max) {
    return {
      allowed: false,
      message: `وصلت المنظمة للحد الأقصى المسموح به من ${LIMIT_LABELS[limitKey]} (${max}) بالخطة الحالية. يرجى ترقية الخطة للمتابعة.`,
    };
  }
  return { allowed: true };
}

// Checks whether an organization's subscription currently allows adding new members.
// Only "trial" (free, within its 30 days) and "active" (paid, currently valid) subscriptions
// allow it — "pending" (paid plan never completed payment), "expired" (trial or paid lapsed),
// and "cancelled" all block it. An admin can grant permanentFree to skip expiry entirely.
// Blocking only affects the org's "add member" actions — everyone already in the org keeps
// full access to their dashboard and can keep publishing courses, sessions, and products.
export async function checkOrgLocked(orgId: string | undefined | null): Promise<LimitCheckResult> {
  if (!orgId) return { allowed: true };

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, orgId)).limit(1);
  if (!sub) return { allowed: true };

  if (sub.permanentFree) return { allowed: true };
  if (sub.status === 'trial' || sub.status === 'active') return { allowed: true };

  return {
    allowed: false,
    message: sub.status === 'expired'
      ? 'انتهت الفترة التجريبية المجانية أو الاشتراك المدفوع لمنظمتك. يرجى الاشتراك أو التجديد لإضافة أعضاء جدد.'
      : 'اشتراك منظمتك غير مفعّل. يرجى إتمام الدفع لإضافة أعضاء جدد للمنظمة.',
  };
}
