import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { socialContent } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const items = await db.select().from(socialContent)
      .where(eq(socialContent.beneficiaryId, decoded.uid))
      .orderBy(desc(socialContent.createdAt));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();

    const { title, type, mediaUrl, mediaUrls } = body;
    if (!mediaUrl || (type !== 'image' && type !== 'video')) {
      return NextResponse.json({ error: 'بيانات المحتوى غير مكتملة' }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(socialContent).values({
      id,
      beneficiaryId: decoded.uid,
      title: title || '',
      type,
      mediaUrl,
      mediaUrls: Array.isArray(mediaUrls) && mediaUrls.length ? mediaUrls : null,
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'المعرّف مفقود' }, { status: 400 });

    const [item] = await db.select().from(socialContent).where(eq(socialContent.id, id)).limit(1);
    if (!item || item.beneficiaryId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await db.delete(socialContent).where(eq(socialContent.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
