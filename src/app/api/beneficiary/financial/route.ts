import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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

    // Find stores owned by this beneficiary
    const storesSnap = await adminDb.collection('stores').where('beneficiaryId', '==', uid).get();
    const storeIds = storesSnap.docs.map(d => d.id);

    const orderDocs: any[] = [];

    if (storeIds.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < storeIds.length; i += 10) chunks.push(storeIds.slice(i, i + 10));

      for (const chunk of chunks) {
        const snap = await adminDb.collection('orders').where('storeId', 'in', chunk).get();
        snap.docs.forEach(d => {
          const data = d.data();
          const totalAmount = data.totalAmount ?? data.productPrice ?? 0;
          const commissionAmount = Math.round((totalAmount * commissionRate) / 100 * 100) / 100;
          const netAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;
          orderDocs.push({
            id: d.id,
            ...data,
            totalAmount,
            commissionRate,
            commissionAmount,
            netAmount,
            createdAt: normalizeDate(data.createdAt),
          });
        });
      }
    }

    // Also fetch direct beneficiaryId orders
    const directSnap = await adminDb.collection('orders').where('beneficiaryId', '==', uid).get();
    directSnap.docs.forEach(d => {
      if (!orderDocs.find(o => o.id === d.id)) {
        const data = d.data();
        const totalAmount = data.totalAmount ?? data.productPrice ?? 0;
        const commissionAmount = Math.round((totalAmount * commissionRate) / 100 * 100) / 100;
        const netAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;
        orderDocs.push({
          id: d.id,
          ...data,
          totalAmount,
          commissionRate,
          commissionAmount,
          netAmount,
          createdAt: normalizeDate(data.createdAt),
        });
      }
    });

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
      summary: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
