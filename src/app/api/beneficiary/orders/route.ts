import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, orders } from '@/lib/schema';
import { eq, or, inArray, desc } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const storeRows = await db.select({ id: stores.id }).from(stores).where(eq(stores.beneficiaryId, uid));
    const storeIds = storeRows.map(s => s.id);

    const rows = await db.select().from(orders).where(
      storeIds.length ? or(inArray(orders.storeId, storeIds), eq(orders.userId, uid)) : eq(orders.userId, uid)
    ).orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
