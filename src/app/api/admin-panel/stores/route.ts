import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { orders, products, stores, users } from '@/lib/schema';
import { eq, desc, count, inArray } from 'drizzle-orm';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'stores';

  if (type === 'orders') {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return NextResponse.json({
      orders: rows.map(o => ({
        id: o.id,
        productName: o.productName || '',
        storeName: o.storeName || '',
        buyerName: o.buyerName || '',
        buyerPhone: o.buyerPhone || '',
        buyerAddress: o.buyerAddress || '',
        totalAmount: o.totalAmount || 0,
        status: o.status || 'pending',
        paymentMethod: o.paymentMethod || 'cod',
        paymentStatus: o.paymentStatus || 'unpaid',
        createdAt: o.createdAt,
      })),
    });
  }

  if (type === 'products') {
    const rows = await db.select().from(products);
    return NextResponse.json({
      products: rows.map(p => ({
        id: p.id, name: p.name, price: p.price, category: p.category, status: p.status,
        hidden: p.hidden ?? false, imageUrl: p.image || '', userId: p.userId, storeId: p.storeId,
        createdAt: p.createdAt,
      })),
    });
  }

  // stores (default)
  const storeRows = await db.select().from(stores);
  const storeIds = storeRows.map(s => s.id);
  const productCounts = storeIds.length
    ? await db.select({ storeId: products.storeId, c: count() }).from(products).where(inArray(products.storeId, storeIds)).groupBy(products.storeId)
    : [];
  const countMap = new Map(productCounts.map(p => [p.storeId, p.c]));

  const beneficiaryIds = Array.from(new Set(storeRows.map(s => s.beneficiaryId).filter(Boolean))) as string[];
  const ownerRows = beneficiaryIds.length ? await db.select().from(users).where(inArray(users.id, beneficiaryIds)) : [];
  const ownerById = new Map(ownerRows.map(u => [u.id, u]));

  const result = storeRows.map(s => {
    const owner = s.beneficiaryId ? ownerById.get(s.beneficiaryId) : undefined;
    return {
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl || '',
      location: s.location || '',
      beneficiaryName: s.beneficiaryName || owner?.name || '',
      beneficiaryId: s.beneficiaryId || '',
      organizationId: s.organizationId || '',
      ownerRole: owner?.role || '',
      hidden: s.hidden ?? false,
      productsCount: countMap.get(s.id) || 0,
      createdAt: s.createdAt,
    };
  });

  return NextResponse.json({ stores: result });
}
