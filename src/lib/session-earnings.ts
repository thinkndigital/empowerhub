import { adminDb } from '@/lib/firebase-admin';

export interface SessionEarningEntry {
  id: string;
  type: 'session';
  courseId: string;
  courseName: string;
  productName: string;
  buyerName: string;
  buyerPhone: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string | null;
  hours: number;
  organizationId: string;
  organizationName: string;
}

export interface SessionEarningsSummary {
  hourlyRate: number;
  orgCommissionPercent: number;
  billableSessions: number;
  totalHours: number;
  gross: number;
  orgCut: number;
  net: number;
  organizationId: string;
  organizationName: string;
}

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

function sessionDate(s: any): Date | null {
  const iso = normalizeDate(s.date);
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// A session counts toward pay once it has actually happened: either the host
// explicitly marked it completed, or its scheduled time has passed and it
// wasn't cancelled. Relying on 'completed' alone undercounts, since mentors/
// coaches rarely go back and mark old sessions — this is what made the
// dashboard totals look wrong. Exported so other billing surfaces (the
// per-person hourly-contract tables) apply the same definition.
export function isBillable(s: any): boolean {
  if (s.status === 'cancelled') return false;
  if (s.status === 'completed') return true;
  const d = sessionDate(s);
  return !!d && d.getTime() < Date.now();
}

// Computes what an organization owes a mentor or coach for the sessions they
// hosted: hourly rate (set on organizations/{orgId}.mentorshipSessionPrice or
// .courseSessionPrice) × session duration, minus the org's own cut
// (organizations/{orgId}.orgCommissionPercent). Returns entries shaped like
// the existing course-order records so callers can merge the two into one
// combined earnings list/summary.
export async function computeSessionEarnings(
  uid: string,
  role: 'mentor' | 'coach',
  organizationId: string | null | undefined,
): Promise<{ entries: SessionEarningEntry[]; summary: SessionEarningsSummary }> {
  const empty = {
    entries: [] as SessionEarningEntry[],
    summary: { hourlyRate: 0, orgCommissionPercent: 0, billableSessions: 0, totalHours: 0, gross: 0, orgCut: 0, net: 0, organizationId: '', organizationName: '' },
  };
  if (!organizationId) return empty;

  const orgSnap = await adminDb.collection('organizations').doc(organizationId).get();
  const orgData = orgSnap.data();
  const hourlyRate: number = (role === 'mentor' ? orgData?.mentorshipSessionPrice : orgData?.courseSessionPrice) ?? 0;
  const orgCommissionPercent: number = orgData?.orgCommissionPercent ?? 0;
  const organizationName: string = orgData?.name || '';

  const hostSnap = await adminDb.collection('sessions').where('hostId', '==', uid).get();
  const billable = hostSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(isBillable);

  const entries: SessionEarningEntry[] = billable.map(s => {
    const hours = Math.max(0, (s.duration || 0) / 60);
    const gross = Math.round(hourlyRate * hours * 100) / 100;
    const commissionAmount = Math.round(gross * (orgCommissionPercent / 100) * 100) / 100;
    const netAmount = Math.round((gross - commissionAmount) * 100) / 100;
    return {
      id: s.id,
      type: 'session',
      courseId: '',
      courseName: s.title || 'جلسة',
      productName: s.title || 'جلسة',
      buyerName: '',
      buyerPhone: '',
      totalAmount: gross,
      commissionRate: orgCommissionPercent,
      commissionAmount,
      netAmount,
      paymentMethod: '',
      paymentStatus: 'pending',
      status: s.status || 'scheduled',
      createdAt: normalizeDate(s.date),
      hours: Math.round(hours * 100) / 100,
      organizationId,
      organizationName,
    };
  });

  const summary: SessionEarningsSummary = {
    hourlyRate,
    orgCommissionPercent,
    billableSessions: entries.length,
    totalHours: Math.round(entries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100,
    gross: Math.round(entries.reduce((sum, e) => sum + e.totalAmount, 0) * 100) / 100,
    orgCut: Math.round(entries.reduce((sum, e) => sum + e.commissionAmount, 0) * 100) / 100,
    net: Math.round(entries.reduce((sum, e) => sum + e.netAmount, 0) * 100) / 100,
    organizationId,
    organizationName,
  };

  return { entries, summary };
}
