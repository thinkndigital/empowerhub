import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, signAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { contentOffers, users, notifications } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const offers = await db.select().from(contentOffers).where(eq(contentOffers.targetUid, decoded.uid));
    return NextResponse.json({ offers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const { offerId, action } = await req.json();
    if (!offerId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const [offer] = await db.select().from(contentOffers).where(eq(contentOffers.id, offerId)).limit(1);
    if (!offer) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    if (offer.targetUid !== decoded.uid) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    if (offer.status !== 'pending') return NextResponse.json({ error: 'تمت معالجة هذا العرض مسبقاً' }, { status: 400 });

    await db.update(contentOffers).set({ status: action === 'accept' ? 'accepted' : 'rejected' }).where(eq(contentOffers.id, offerId));

    let freshToken: string | undefined;
    if (action === 'accept') {
      await db.update(users).set({ organizationId: offer.organizationId }).where(eq(users.id, decoded.uid));
      freshToken = signAuthToken({ uid: decoded.uid, role: decoded.role, organizationId: offer.organizationId });
    }

    const [orgAdmin] = await db.select().from(users)
      .where(and(eq(users.organizationId, offer.organizationId), eq(users.role, 'organization'))).limit(1);
    if (orgAdmin) {
      await db.insert(notifications).values({
        id: randomUUID(),
        userId: orgAdmin.id,
        title: action === 'accept' ? 'تم قبول العرض' : 'تم رفض العرض',
        body: `${offer.targetName} ${action === 'accept' ? 'قبل' : 'رفض'} عرضك${offer.contentTitle ? ` (${offer.contentTitle})` : ''}`,
        link: `/organization-dashboard/${offer.targetRole === 'mentor' ? 'mentors' : 'coaches'}`,
        read: false,
      });
    }

    return NextResponse.json({ success: true, token: freshToken });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
