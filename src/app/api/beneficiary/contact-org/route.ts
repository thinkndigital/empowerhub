import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { subject, message } = body;
    if (!subject || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data() || {};
    const orgId: string | undefined = decoded.organizationId || userData.organizationId;
    const senderName = userData.name || decoded.name || decoded.email || 'مستفيد';

    let orgAdminUid: string | null = null;
    if (orgId) {
      const orgAdminSnap = await adminDb.collection('users')
        .where('role', '==', 'organization')
        .where('organizationId', '==', orgId)
        .limit(1)
        .get();
      if (!orgAdminSnap.empty) orgAdminUid = orgAdminSnap.docs[0].id;
    }

    await adminDb.collection('contactRequests').add({
      senderId: uid,
      senderName,
      organizationId: orgId || null,
      subject,
      message: message.trim(),
      status: 'pending',
      createdAt: new Date(),
    });

    if (orgAdminUid) {
      const notifBody = `${senderName} أرسل طلباً: ${message.trim().slice(0, 80)}`;
      await notifyUser({
        uid: orgAdminUid,
        type: 'contact_request',
        title: `طلب جديد: ${subject}`,
        body: notifBody,
        link: '/organization-dashboard/messages',
        email: {
          subject: `طلب جديد من ${senderName}: ${subject}`,
          bodyHtml: notifBody,
          ctaText: 'عرض الطلب',
          ctaLink: 'https://empowerhub.thinkndigital.com/organization-dashboard/messages',
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
