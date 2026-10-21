import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { getSetting } from '@/lib/app-settings';
import { db } from '@/lib/db';
import { orders, payouts, users } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');
    const userIdFilter = searchParams.get('userId');

    const platformConfig = await getSetting<any>('platform');
    const commissionRate: number = platformConfig?.commissionRate ?? 10;

    const orderRows = await db.select().from(orders);
    const userRows = await db.select().from(users);
    const usersMap = new Map(userRows.map(u => [u.id, { name: u.name || u.displayName || '', role: u.role || '', email: u.email || '' }]));

    let result = orderRows.map(o => {
      const totalAmount = Number(o.totalAmount || 0);
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const netAmount = totalAmount - commissionAmount;
      const userId = o.userId || o.hostId || '';
      const userInfo = usersMap.get(userId) || { name: o.buyerName || '', role: '', email: '' };

      return {
        id: o.id,
        userId,
        userName: userInfo.name || o.buyerName || '',
        userRole: userInfo.role || '',
        productName: o.productName || '',
        totalAmount,
        commissionRate,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        quantity: o.quantity ?? 1,
        status: o.status || 'pending',
        paymentStatus: o.paymentStatus || 'unpaid',
        paymentMethod: o.paymentMethod || '',
        type: o.type || (o.courseId ? 'course' : 'product'),
        createdAt: o.createdAt,
        courseId: o.courseId || null,
        storeId: o.storeId || null,
      };
    });

    if (roleFilter) {
      result = result.filter(o => o.userRole === roleFilter);
    }
    if (userIdFilter) {
      result = result.filter(o => o.userId === userIdFilter);
    }

    result.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    let payoutRows = await db.select().from(payouts);
    if (userIdFilter) {
      payoutRows = payoutRows.filter(p => p.userId === userIdFilter);
    }

    return NextResponse.json({ orders: result, payouts: payoutRows, commissionRate });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
