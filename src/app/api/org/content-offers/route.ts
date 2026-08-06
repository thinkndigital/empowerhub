import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    const orgId = userData.organizationId || (decoded as any).organizationId || '';
    if (!orgId || userData.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const snap = await adminDb.collection('contentOffers').where('orgId', '==', orgId).get();
    const offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ offers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    const orgId = userData.organizationId || (decoded as any).organizationId || '';
    if (!orgId || userData.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
    const orgName = orgSnap.data()?.name || userData.name || '';

    const body = await req.json();
    const { targetUid, targetName, targetRole, offerType, contentId = '', contentTitle = '', note = '' } = body;

    if (!targetUid || !targetRole || !offerType) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    // Prevent duplicate pending offers
    const existing = await adminDb.collection('contentOffers')
      .where('orgId', '==', orgId)
      .where('targetUid', '==', targetUid)
      .where('offerType', '==', offerType)
      .where('contentId', '==', contentId)
      .where('status', '==', 'pending')
      .get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'تم إرسال عرض مماثل مسبقاً' }, { status: 400 });
    }

    const typeLabel: Record<string, string> = {
      course: 'دورة مسجلة',
      live_session: 'جلسة مباشرة',
      sessions: 'خدمات الإرشاد',
    };

    await adminDb.collection('contentOffers').add({
      orgId,
      orgName,
      targetUid,
      targetName,
      targetRole,
      offerType,
      contentId,
      contentTitle,
      note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const offerBody = `دعتك منظمة ${orgName} بعرض ${typeLabel[offerType] || offerType}${contentTitle ? `: ${contentTitle}` : ''}`;
    await notifyUser({
      uid: targetUid,
      type: 'content_offer',
      title: 'عرض من منظمة',
      body: offerBody,
      link: `/${targetRole}-dashboard/invitations`,
      email: { subject: 'عرض جديد من منظمة', bodyHtml: offerBody, ctaText: 'عرض الدعوة', ctaLink: `${SITE_URL}/${targetRole}-dashboard/invitations` },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
