import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { courses, orders, enrollments, notifications } from '@/lib/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const mentorId = decoded.uid;

    const courseRows = await db.select().from(courses).where(eq(courses.createdBy, mentorId));
    if (courseRows.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const courseIds = courseRows.map(c => c.id);
    const courseNames: Record<string, string> = {};
    for (const c of courseRows) courseNames[c.id] = c.title || '';

    const orderRows = await db.select().from(orders)
      .where(inArray(orders.courseId, courseIds))
      .orderBy(desc(orders.createdAt));

    const allOrders = orderRows.map(o => ({
      id: o.id,
      courseId: o.courseId || '',
      courseName: courseNames[o.courseId || ''] || o.productName || '',
      buyerName: o.buyerName || '',
      buyerPhone: o.buyerPhone || '',
      amount: o.totalAmount ?? 0,
      paymentMethod: o.paymentMethod || 'cod',
      paymentStatus: o.paymentStatus || 'unpaid',
      status: o.status || 'pending',
      createdAt: o.createdAt,
    }));

    return NextResponse.json({ orders: allOrders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Update order status (confirm / reject)
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const mentorId = decoded.uid;

    const { orderId, status } = await req.json();
    if (!orderId || !status) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });

    const [course] = await db.select().from(courses).where(eq(courses.id, order.courseId || '')).limit(1);
    if (!course || course.createdBy !== mentorId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updates: Record<string, any> = { status };
    const courseTitle = course.title || 'الدورة';
    const courseUrl = `https://empowerhub.tech/courses/${order.courseId}`;

    if (status === 'confirmed') {
      updates.paymentStatus = 'paid';
      updates.confirmedAt = new Date();

      if (order.userId) {
        try {
          await db.insert(enrollments).values({
            id: randomUUID(), courseId: order.courseId!, userId: order.userId, progress: 0,
          }).onDuplicateKeyUpdate({ set: { progress: 0 } });
          await db.insert(notifications).values({
            id: randomUUID(),
            userId: order.userId,
            type: 'course_enrolled',
            title: 'تم تأكيد اشتراكك في الدورة',
            body: `تم قبول طلبك والتسجيل في دورة "${courseTitle}". يمكنك بدء الدورة الآن.`,
            link: `/dashboard/training/${order.courseId}`,
            read: false,
          });
        } catch { /* non-fatal */ }
      }
    }

    await db.update(orders).set(updates).where(eq(orders.id, orderId));

    return NextResponse.json({
      ok: true,
      courseUrl,
      courseTitle,
      isGuest: !order.userId,
      buyerPhone: order.buyerPhone || '',
      buyerName: order.buyerName || '',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
