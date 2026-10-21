import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products, orders, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    let orgId = decoded.organizationId;
    if (!orgId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const [storeRows, productRows, orderRows] = await Promise.all([
      db.select().from(stores).where(eq(stores.organizationId, orgId)),
      db.select().from(products).where(eq(products.organizationId, orgId)),
      db.select().from(orders).where(eq(orders.organizationId, orgId)),
    ]);

    return NextResponse.json({ stores: storeRows, products: productRows, orders: orderRows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
