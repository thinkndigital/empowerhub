import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { stores, products, orders, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [storeRows, productRows, orderRows] = await Promise.all([
      db.select().from(stores).where(eq(stores.beneficiaryId, uid)).limit(1),
      db.select().from(products).where(eq(products.userId, uid)),
      db.select().from(orders).where(eq(orders.userId, uid)),
    ]);

    return NextResponse.json({ store: storeRows[0] || null, products: productRows, orders: orderRows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// إضافة منتج جديد
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;
    const body = await req.json();

    const [userRow] = await db.select().from(users).where(eq(users.id, uid)).limit(1);

    const { id: _ignoredId, ...rest } = body;
    const id = randomUUID();
    await db.insert(products).values({
      ...rest,
      id,
      userId: uid,
      beneficiaryName: userRow?.name || '',
      organizationId: userRow?.organizationId || null,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// تعديل منتج أو تحديث حالة طلب
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const body = await req.json();
    const { id, _collection, ...fields } = body;

    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });
    delete fields.id;

    if (_collection === 'orders') {
      await db.update(orders).set(fields).where(eq(orders.id, id));
    } else {
      await db.update(products).set(fields).where(eq(products.id, id));
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// حذف منتج أو طلب
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyAuthToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    const type = req.nextUrl.searchParams.get('type') || 'product';
    if (type === 'order') {
      await db.delete(orders).where(eq(orders.id, id));
    } else {
      await db.delete(products).where(eq(products.id, id));
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
