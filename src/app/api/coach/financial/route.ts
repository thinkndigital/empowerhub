import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { appSettings, courses, orders, payouts } from '@/lib/schema';
import { eq, inArray, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [platformConfig] = await db.select().from(appSettings).where(eq(appSettings.key, 'platform')).limit(1);
    const commissionRate: number = platformConfig?.value?.commissionRate ?? 10;

    const courseRows = await db.select().from(courses).where(eq(courses.createdBy, uid));
    const courseNames = new Map(courseRows.map(c => [c.id, c.title || '']));
    const courseIds = courseRows.map(c => c.id);

    const orderRows = courseIds.length
      ? await db.select().from(orders).where(inArray(orders.courseId, courseIds)).orderBy(desc(orders.createdAt))
      : [];

    const orderDocs = orderRows.map(o => {
      const totalAmount = Number(o.totalAmount || 0);
      const commissionAmount = Math.round((totalAmount * commissionRate) / 100 * 100) / 100;
      const netAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;
      return {
        id: o.id,
        courseId: o.courseId || '',
        courseName: courseNames.get(o.courseId || '') || o.productName || '',
        productName: courseNames.get(o.courseId || '') || o.productName || '',
        buyerName: o.buyerName || '',
        buyerPhone: o.buyerPhone || '',
        totalAmount,
        commissionRate,
        commissionAmount,
        netAmount,
        paymentMethod: o.paymentMethod || 'cod',
        paymentStatus: o.paymentStatus || 'unpaid',
        status: o.status || 'pending',
        type: 'course',
        createdAt: o.createdAt,
      };
    });

    const payoutRows = await db.select().from(payouts).where(eq(payouts.userId, uid));

    const totalGross = orderDocs.reduce((s, o) => s + o.totalAmount, 0);
    const totalCommission = orderDocs.reduce((s, o) => s + o.commissionAmount, 0);
    const totalNet = orderDocs.reduce((s, o) => s + o.netAmount, 0);
    const totalPaid = payoutRows
      .filter(p => p.status === 'paid')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const remaining = Math.max(0, totalNet - totalPaid);

    return NextResponse.json({
      orders: orderDocs,
      payouts: payoutRows,
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
