import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products } from '@/lib/schema';
import { eq, ne } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const storeRows = await db.select().from(stores).where(ne(stores.hidden, true)).limit(100);
    const storesResult = storeRows.map(s => ({
      id: s.id, slug: s.slug || '', name: s.name, logoUrl: s.logoUrl, coverUrl: s.coverUrl || '', location: s.location, beneficiaryName: s.beneficiaryName,
    }));

    const productRows = await db.select().from(products).where(ne(products.hidden, true));
    const productsResult = productRows.map(p => ({ ...p, id: p.id, storeId: p.userId || p.storeId || '' }));

    return NextResponse.json({ stores: storesResult, products: productsResult });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
