import { adminDb } from '@/lib/firebase-admin';

type LimitKey = 'maxUsers' | 'maxMentors' | 'maxCourses' | 'maxProducts';

const LIMIT_LABELS: Record<LimitKey, string> = {
  maxUsers: 'المستفيدين',
  maxMentors: 'المرشدين والمدربين',
  maxCourses: 'الدورات',
  maxProducts: 'المنتجات',
};

export type LimitCheckResult = { allowed: true } | { allowed: false; message: string };

// Checks whether an organization can add one more item of the given kind under its current plan.
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
  switch (limitKey) {
    case 'maxUsers': {
      const snap = await adminDb.collection('users')
        .where('organizationId', '==', orgId)
        .where('role', '==', 'beneficiary')
        .get();
      current = snap.size;
      break;
    }
    case 'maxMentors': {
      const [mentors, coaches] = await Promise.all([
        adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'mentor').get(),
        adminDb.collection('users').where('organizationId', '==', orgId).where('role', '==', 'coach').get(),
      ]);
      current = mentors.size + coaches.size;
      break;
    }
    case 'maxCourses': {
      const snap = await adminDb.collection('courses').where('organizationId', '==', orgId).get();
      current = snap.size;
      break;
    }
    case 'maxProducts': {
      // Products are created via two paths with different org-id field names
      // (`orgId` from the org store route, `organizationId` from the beneficiary store route).
      const [byOrgId, byOrganizationId] = await Promise.all([
        adminDb.collection('products').where('orgId', '==', orgId).get(),
        adminDb.collection('products').where('organizationId', '==', orgId).get(),
      ]);
      const seen = new Set<string>();
      for (const d of [...byOrgId.docs, ...byOrganizationId.docs]) seen.add(d.id);
      current = seen.size;
      break;
    }
  }

  if (current >= max) {
    return {
      allowed: false,
      message: `وصلت المنظمة للحد الأقصى المسموح به من ${LIMIT_LABELS[limitKey]} (${max}) بالخطة الحالية. يرجى ترقية الخطة للمتابعة.`,
    };
  }
  return { allowed: true };
}

// Checks whether an organization's subscription is currently locked (expired, unpaid).
// This is the server-side counterpart to the dashboard lock screen — the UI hides the
// content-creation pages for a locked org, but every route that writes org-owned content
// must also refuse the write directly, since the UI check alone can be bypassed by calling
// the API directly.
export async function checkOrgLocked(orgId: string | undefined | null): Promise<LimitCheckResult> {
  if (!orgId) return { allowed: true };

  const subSnap = await adminDb.collection('subscriptions').doc(orgId).get();
  if (!subSnap.exists) return { allowed: true };

  if (subSnap.data()?.status === 'locked') {
    return {
      allowed: false,
      message: 'اشتراك منظمتك منتهٍ. يرجى إتمام الدفع لإعادة تفعيل المنصة.',
    };
  }
  return { allowed: true };
}
