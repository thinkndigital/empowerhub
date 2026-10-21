import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { lt, inArray } from 'drizzle-orm';

export async function POST() {
  try {
    const cutoff = new Date('2026-06-19');
    cutoff.setHours(0, 0, 0, 0);

    const toDelete = await db.select({ id: products.id }).from(products).where(lt(products.createdAt, cutoff));
    const toKeep = await db.select({ id: products.id, name: products.name, createdAt: products.createdAt }).from(products);
    const keptAfterCutoff = toKeep.filter(p => !toDelete.some(d => d.id === p.id));

    if (toDelete.length) {
      await db.delete(products).where(inArray(products.id, toDelete.map(d => d.id)));
    }

    return NextResponse.json({ deleted: toDelete.length, kept: keptAfterCutoff.length, kept_products: keptAfterCutoff });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
