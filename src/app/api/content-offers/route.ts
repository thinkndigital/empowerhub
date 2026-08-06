import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { notifyUser } from '@/lib/notify';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const snap = await adminDb.collection('contentOffers').where('targetUid', '==', decoded.uid).get();
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

    const { offerId, action } = await req.json();
    if (!offerId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const offerRef = adminDb.collection('contentOffers').doc(offerId);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const offer = offerSnap.data()!;
    if (offer.targetUid !== decoded.uid) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    if (offer.status !== 'pending') return NextResponse.json({ error: 'تمت معالجة هذا العرض مسبقاً' }, { status: 400 });

    await offerRef.update({ status: action === 'accept' ? 'accepted' : 'rejected' });

    if (action === 'accept') {
      // Link user to org (same as orgInvitations flow)
      await adminDb.collection('users').doc(decoded.uid).update({ organizationId: offer.orgId });
      const currentUser = await adminAuth.getUser(decoded.uid);
      const claims = currentUser.customClaims || {};
      await adminAuth.setCustomUserClaims(decoded.uid, { ...claims, organizationId: offer.orgId });
    }

    // Notify the org admin
    const orgAdminSnap = await adminDb.collection('users')
      .where('organizationId', '==', offer.orgId)
      .where('role', '==', 'organization')
      .limit(1).get();
    const orgAdminUid = orgAdminSnap.docs[0]?.id;
    if (orgAdminUid) {
      const bodyText = `${offer.targetName} ${action === 'accept' ? 'قبل' : 'رفض'} عرضك${offer.contentTitle ? ` (${offer.contentTitle})` : ''}`;
      await notifyUser({
        uid: orgAdminUid,
        type: 'content_offer',
        title: action === 'accept' ? 'تم قبول العرض' : 'تم رفض العرض',
        body: bodyText,
        link: `/organization-dashboard/${offer.targetRole === 'mentor' ? 'mentors' : 'coaches'}`,
        email: { subject: action === 'accept' ? 'تم قبول العرض' : 'تم رفض العرض', bodyHtml: bodyText },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
