import { adminDb } from '@/lib/firebase-admin';

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

  const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
  const planKey = orgSnap.data()?.plan;
  if (!planKey) return { allowed: true };

  const planSnap = await adminDb.collection('plans').where('key', '==', planKey).limit(1).get();
  if (planSnap.empty) return { allowed: true };

  const max = planSnap.docs[0].data()?.limits?.[limitKey];
  if (max == null || max === -1) return { allowed: true };

  let current = 0;
  if (limitKey === 'maxUsers') {
    const snap = await adminDb.collection('users')
      .where('organizationId', '==', orgId)
      .where('role', '==', 'beneficiary')
      .get();
    current = snap.size;
  } else {
    const [mentors, coaches] = await Promise.all([
      adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'mentor').get(),
      adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'coach').get(),
    ]);
    current = mentors.size + coaches.size;
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

  const subSnap = await adminDb.collection('subscriptions').doc(orgId).get();
  if (!subSnap.exists) return { allowed: true };

  const sub = subSnap.data();
  if (sub?.permanentFree) return { allowed: true };
  if (sub?.status === 'trial' || sub?.status === 'active') return { allowed: true };

  return {
    allowed: false,
    message: sub?.status === 'expired'
      ? 'انتهت الفترة التجريبية المجانية أو الاشتراك المدفوع لمنظمتك. يرجى الاشتراك أو التجديد لإضافة أعضاء جدد.'
      : 'اشتراك منظمتك غير مفعّل. يرجى إتمام الدفع لإضافة أعضاء جدد للمنظمة.',
  };
}
