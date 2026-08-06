import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { computeSessionEarnings } from '@/lib/session-earnings';

export const dynamic = 'force-dynamic';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Get commission rate from config
    const configDoc = await adminDb.collection('config').doc('platform').get();
    const commissionRate: number = configDoc.exists ? (configDoc.data()?.commissionRate ?? 10) : 10;

    // Get all courses created by this mentor
    const coursesSnap = await adminDb.collection('courses').where('createdBy', '==', uid).get();

    const orderDocs: any[] = [];

    if (!coursesSnap.empty) {
      const courseIds = coursesSnap.docs.map(d => d.id);
      const courseNames: Record<string, string> = {};
      coursesSnap.docs.forEach(d => { courseNames[d.id] = d.data().title || ''; });

      const chunkSize = 30;
      for (let i = 0; i < courseIds.length; i += chunkSize) {
        const chunk = courseIds.slice(i, i + chunkSize);
        const snap = await adminDb.collection('orders').where('courseId', 'in', chunk).get();
        snap.docs.forEach(d => {
          const data = d.data();
          const totalAmount = data.totalAmount ?? data.productPrice ?? data.amount ?? 0;
          const commissionAmount = Math.round((totalAmount * commissionRate) / 100 * 100) / 100;
          const netAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;
          orderDocs.push({
            id: d.id,
            courseId: data.courseId || '',
            courseName: courseNames[data.courseId] || data.productName || '',
            productName: courseNames[data.courseId] || data.productName || '',
            buyerName: data.buyerName || '',
            buyerPhone: data.buyerPhone || '',
            totalAmount,
            commissionRate,
            commissionAmount,
            netAmount,
            paymentMethod: data.paymentMethod || 'cod',
            paymentStatus: data.paymentStatus || 'unpaid',
            status: data.status || 'pending',
            type: 'course',
            createdAt: normalizeDate(data.createdAt),
          });
        });
      }
    }

    // Session-based earnings: the org pays an hourly rate (set on the org's
    // settings page) for mentorship sessions this mentor hosted, minus the
    // org's own commission — separate from the platform's course-sale cut.
    let organizationId = (decoded as any).organizationId as string | undefined;
    if (!organizationId) {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      organizationId = userDoc.data()?.organizationId;
    }
    const { entries: sessionEntries, summary: sessionSummary } = await computeSessionEarnings(uid, 'mentor', organizationId);
    orderDocs.push(...sessionEntries);

    orderDocs.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    // Fetch payouts for this user
    const payoutsSnap = await adminDb.collection('payouts').where('userId', '==', uid).get();
    const payouts = payoutsSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: normalizeDate((d.data() as any).createdAt),
      paidAt: normalizeDate((d.data() as any).paidAt),
    }));

    // Calculate summary
    const totalGross = orderDocs.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalCommission = orderDocs.reduce((s, o) => s + (o.commissionAmount || 0), 0);
    const totalNet = orderDocs.reduce((s, o) => s + (o.netAmount || 0), 0);
    const totalPaid = payouts
      .filter((p: any) => p.status === 'paid')
      .reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const remaining = Math.max(0, totalNet - totalPaid);

    return NextResponse.json({
      orders: orderDocs,
      payouts,
      commissionRate,
      sessionEarnings: sessionSummary,
      summary: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
