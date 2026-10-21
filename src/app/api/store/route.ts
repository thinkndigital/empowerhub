import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { stores, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';
import { uniqueStoreSlug } from '@/lib/store-slug';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const [store] = await db.select().from(stores).where(eq(stores.beneficiaryId, decoded.uid)).limit(1);
    return NextResponse.json({ store: store || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'اسم المتجر مطلوب' }, { status: 400 });
    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const slug = await uniqueStoreSlug(body.name);
    const id = randomUUID();
    await db.insert(stores).values({
      ...body,
      id,
      slug,
      beneficiaryId: decoded.uid,
      beneficiaryName: userRow?.name || '',
      organizationId: userRow?.organizationId || null,
    });
    return NextResponse.json({ id, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const [store] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    if (!store || store.beneficiaryId !== decoded.uid)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const slug = fields.name && fields.name !== store.name
      ? await uniqueStoreSlug(fields.name, id)
      : (store.slug || (fields.name ? await uniqueStoreSlug(fields.name, id) : undefined));
    await db.update(stores).set({ ...fields, ...(slug !== undefined ? { slug } : {}) }).where(eq(stores.id, id));
    return NextResponse.json({ success: true, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
