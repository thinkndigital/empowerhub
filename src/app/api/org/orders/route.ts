import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
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
    if (!orgId) return NextResponse.json({ orders: [] });

    const rows = await db.select().from(orders).where(eq(orders.organizationId, orgId)).orderBy(desc(orders.createdAt));
    return NextResponse.json({ orders: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
