import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { contentOffers, organizations, users, notifications } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [caller] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const orgId = caller?.organizationId || decoded.organizationId || '';
    if (!orgId || caller?.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const rows = await db.select().from(contentOffers).where(eq(contentOffers.organizationId, orgId));
    return NextResponse.json({ offers: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [caller] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const orgId = caller?.organizationId || decoded.organizationId || '';
    if (!orgId || caller?.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const orgName = org?.name || caller?.name || '';

    const body = await req.json();
    const { targetUid, targetName, targetRole, offerType, contentId = '', contentTitle = '', note = '' } = body;

    if (!targetUid || !targetRole || !offerType) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    // Prevent duplicate pending offers
    const [existing] = await db.select().from(contentOffers).where(and(
      eq(contentOffers.organizationId, orgId),
      eq(contentOffers.targetUid, targetUid),
      eq(contentOffers.offerType, offerType),
      eq(contentOffers.contentId, contentId),
      eq(contentOffers.status, 'pending'),
    )).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'تم إرسال عرض مماثل مسبقاً' }, { status: 400 });
    }

    const typeLabel: Record<string, string> = {
      course: 'دورة مسجلة',
      live_session: 'جلسة مباشرة',
      sessions: 'خدمات الإرشاد',
    };

    await db.insert(contentOffers).values({
      id: randomUUID(),
      organizationId: orgId,
      orgName,
      targetUid,
      targetName,
      targetRole,
      offerType,
      contentId,
      contentTitle,
      note,
      status: 'pending',
    });

    await db.insert(notifications).values({
      id: randomUUID(),
      userId: targetUid,
      title: 'عرض من منظمة',
      body: `دعتك منظمة ${orgName} بعرض ${typeLabel[offerType] || offerType}${contentTitle ? `: ${contentTitle}` : ''}`,
      link: `/${targetRole}-dashboard/invitations`,
      read: false,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
