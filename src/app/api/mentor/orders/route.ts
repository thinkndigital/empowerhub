import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const mentorId = decoded.uid;

    // Get all courses created by this mentor
    const coursesSnap = await adminDb.collection('courses')
      .where('createdBy', '==', mentorId)
      .get();

    if (coursesSnap.empty) {
      return NextResponse.json({ orders: [] });
    }

    const courseIds = coursesSnap.docs.map(d => d.id);
    const courseNames: Record<string, string> = {};
    coursesSnap.docs.forEach(d => {
      courseNames[d.id] = d.data().title || '';
    });

    // Firestore 'in' supports up to 30 items; chunk if needed
    const chunkSize = 30;
    const allOrders: any[] = [];

    for (let i = 0; i < courseIds.length; i += chunkSize) {
      const chunk = courseIds.slice(i, i + chunkSize);
      const snap = await adminDb.collection('orders')
        .where('courseId', 'in', chunk)
        .get();
      snap.docs.forEach(d => {
        const data = d.data();
        allOrders.push({
          id: d.id,
          courseId: data.courseId || '',
          courseName: courseNames[data.courseId] || data.productName || '',
          buyerName: data.buyerName || '',
          buyerPhone: data.buyerPhone || '',
          amount: data.totalAmount ?? data.productPrice ?? 0,
          paymentMethod: data.paymentMethod || 'cod',
          paymentStatus: data.paymentStatus || 'unpaid',
          status: data.status || 'pending',
          createdAt: data.createdAt?._seconds
            ? new Date(data.createdAt._seconds * 1000).toISOString()
            : data.createdAt instanceof Date
              ? data.createdAt.toISOString()
              : data.createdAt || '',
        });
      });
    }

    // Sort newest first (in memory)
    allOrders.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    return NextResponse.json({ orders: allOrders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Update order status (confirm / reject)
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const mentorId = decoded.uid;

    const { orderId, status } = await req.json();
    if (!orderId || !status) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });

    // Verify the order belongs to a course by this mentor
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });

    const orderData = orderDoc.data()!;
    const courseDoc = await adminDb.collection('courses').doc(orderData.courseId).get();
    if (!courseDoc.exists || courseDoc.data()?.createdBy !== mentorId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const updates: any = { status };
    const courseData = courseDoc.data()!;
    const courseTitle = courseData.title || 'الدورة';
    const courseUrl = `https://empowerhub.thinkndigital.com/courses/${orderData.courseId}`;

    if (status === 'confirmed') {
      updates.paymentStatus = 'paid';
      updates.confirmedAt = new Date();

      const { FieldValue } = await import('firebase-admin/firestore');

      // Enroll the registered user and send in-app notification
      if (orderData.userId) {
        try {
          await adminDb.collection('courses').doc(orderData.courseId)
            .collection('enrollments').doc(orderData.userId).set({
              enrolledAt: new Date(),
              progress: 0,
              enrolledBy: 'mentor_order',
            }, { merge: true });
          await adminDb.collection('users').doc(orderData.userId).update({
            enrolledCourses: FieldValue.arrayUnion(orderData.courseId),
          });
          // In-app notification with course link
          await adminDb.collection('notifications').add({
            userId: orderData.userId,
            type: 'course_enrolled',
            title: 'تم تأكيد اشتراكك في الدورة',
            body: `تم قبول طلبك والتسجيل في دورة "${courseTitle}". يمكنك بدء الدورة الآن.`,
            link: `/dashboard/training/${orderData.courseId}`,
            read: false,
            createdAt: new Date(),
          });
        } catch { /* non-fatal */ }
      }
    }

    await adminDb.collection('orders').doc(orderId).update(updates);

    // Return course info so the client can build a WhatsApp link for guests
    return NextResponse.json({
      ok: true,
      courseUrl,
      courseTitle,
      isGuest: !orderData.userId,
      buyerPhone: orderData.buyerPhone || '',
      buyerName: orderData.buyerName || '',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
