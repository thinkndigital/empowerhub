import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { stores, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';
import { uniqueStoreSlug as uniqueSlug } from '@/lib/store-slug';

// إنشاء متجر جديد
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [userRow] = await db.select().from(users).where(eq(users.id, uid)).limit(1);

    const body = await req.json();
    const { id: _id, ...data } = body;

    const slug = data.name ? await uniqueSlug(data.name) : '';

    const id = randomUUID();
    await db.insert(stores).values({
      ...data,
      id,
      slug,
      beneficiaryId: uid,
      beneficiaryName: userRow?.name || '',
      organizationId: userRow?.organizationId || null,
    });

    return NextResponse.json({ id, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// تحديث متجر موجود
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

    const [store] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    if (!store || store.beneficiaryId !== uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // أعد توليد الرابط المخصص فقط إذا تغيّر اسم المتجر
    const slug = data.name && data.name !== store.name
      ? await uniqueSlug(data.name, id)
      : (store.slug || (data.name ? await uniqueSlug(data.name, id) : ''));

    await db.update(stores).set({ ...data, slug }).where(eq(stores.id, id));

    return NextResponse.json({ id, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
