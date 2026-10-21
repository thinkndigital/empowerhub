import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, stripPasswords } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users, organizations, courses, products, orders } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    if (decoded.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [userRows, orgRows, courseRows, productRows, orderRows] = await Promise.all([
      db.select().from(users),
      db.select().from(organizations),
      db.select().from(courses),
      db.select().from(products),
      db.select().from(orders),
    ]);

    return NextResponse.json({
      users: stripPasswords(userRows),
      organizations: orgRows,
      courses: courseRows,
      products: productRows,
      orders: orderRows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
