import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

function normalizeDate(date: any): string | undefined {
  if (!date || typeof date === 'string') return date;
  if (date._seconds || date.seconds) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Find stores owned by this beneficiary
    const storesSnap = await adminDb.collection('stores').where('beneficiaryId', '==', uid).get();
    const storeIds = storesSnap.docs.map(d => d.id);

    if (storeIds.length === 0) {
      // Also try direct orders with beneficiaryId
      const ordersSnap = await adminDb.collection('orders').where('beneficiaryId', '==', uid).get();
      const orders = ordersSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: normalizeDate((d.data() as any).createdAt),
      }));
      return NextResponse.json({ orders });
    }

    // Fetch orders for all stores (Firestore 'in' supports max 30)
    const chunks: string[][] = [];
    for (let i = 0; i < storeIds.length; i += 10) chunks.push(storeIds.slice(i, i + 10));

    const orderDocs: any[] = [];
    for (const chunk of chunks) {
      const snap = await adminDb.collection('orders').where('storeId', 'in', chunk).get();
      snap.docs.forEach(d => orderDocs.push({ id: d.id, ...d.data(), createdAt: normalizeDate((d.data() as any).createdAt) }));
    }

    // Also fetch direct beneficiaryId orders
    const directSnap = await adminDb.collection('orders').where('beneficiaryId', '==', uid).get();
    directSnap.docs.forEach(d => {
      if (!orderDocs.find(o => o.id === d.id)) {
        orderDocs.push({ id: d.id, ...d.data(), createdAt: normalizeDate((d.data() as any).createdAt) });
      }
    });

    orderDocs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return NextResponse.json({ orders: orderDocs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
