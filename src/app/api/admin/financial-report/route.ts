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
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');
    const userIdFilter = searchParams.get('userId');

    // Get commission rate from config
    const configDoc = await adminDb.collection('config').doc('platform').get();
    const commissionRate: number = configDoc.exists ? (configDoc.data()?.commissionRate ?? 10) : 10;

    // Fetch all orders
    let ordersQuery: FirebaseFirestore.Query = adminDb.collection('orders');
    if (userIdFilter) {
      // Filter by userId — try beneficiaryId or userId field
      // We'll filter in-memory since we support both fields
    }

    const ordersSnap = await ordersQuery.get();

    // Fetch all users to get names and roles
    const usersSnap = await adminDb.collection('users').get();
    const usersMap: Record<string, { name: string; role: string; email: string }> = {};
    usersSnap.docs.forEach(d => {
      usersMap[d.id] = {
        name: d.data().name || d.data().displayName || '',
        role: d.data().role || '',
        email: d.data().email || '',
      };
    });

    let orders = ordersSnap.docs.map(d => {
      const data = d.data();
      const totalAmount: number = data.totalAmount ?? data.productPrice ?? data.amount ?? 0;
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const netAmount = totalAmount - commissionAmount;
      const userId = data.beneficiaryId || data.userId || data.hostId || '';
      const userInfo = usersMap[userId] || { name: data.buyerName || '', role: '', email: '' };

      return {
        id: d.id,
        userId,
        userName: userInfo.name || data.buyerName || '',
        userRole: userInfo.role || data.userRole || '',
        productName: data.productName || data.courseName || '',
        totalAmount,
        commissionRate,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        quantity: data.quantity ?? 1,
        status: data.status || 'pending',
        paymentStatus: data.paymentStatus || 'unpaid',
        paymentMethod: data.paymentMethod || '',
        type: data.type || (data.courseId ? 'course' : 'product'),
        createdAt: normalizeDate(data.createdAt),
        courseId: data.courseId || null,
        storeId: data.storeId || null,
      };
    });

    // Apply filters
    if (roleFilter) {
      orders = orders.filter(o => o.userRole === roleFilter);
    }
    if (userIdFilter) {
      orders = orders.filter(o => o.userId === userIdFilter);
    }

    orders.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    // Fetch payouts
    let payoutsQuery: FirebaseFirestore.Query = adminDb.collection('payouts');
    const payoutsSnap = await payoutsQuery.get();
    let payouts = payoutsSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: normalizeDate((d.data() as any).createdAt),
      paidAt: normalizeDate((d.data() as any).paidAt),
    }));

    if (userIdFilter) {
      payouts = payouts.filter((p: any) => p.userId === userIdFilter);
    }

    return NextResponse.json({ orders, payouts, commissionRate });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
