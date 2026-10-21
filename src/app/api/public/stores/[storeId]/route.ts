import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    // القيمة قد تكون الرابط المخصص (slug) أو معرّف المستند — نجرب الرابط المخصص أولاً
    const [bySlug] = await db.select().from(stores).where(eq(stores.slug, params.storeId)).limit(1);
    const store = bySlug || (await db.select().from(stores).where(eq(stores.id, params.storeId)).limit(1))[0];
    if (!store) {
      return NextResponse.json({ error: 'المتجر غير موجود' }, { status: 404 });
    }

    const beneficiaryId = store.beneficiaryId || '';

    // Products can be linked via userId==beneficiaryId or storeId==storeId —
    // try both and deduplicate (mirrors the original's multi-field lookup).
    const productRows = await db.select().from(products).where(
      or(eq(products.userId, beneficiaryId), eq(products.storeId, store.id))
    );

    const seen = new Set<string>();
    const productsResult = productRows
      .filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return !p.hidden;
      })
      .map(p => ({
        id: p.id,
        name: p.name || '',
        description: p.description || '',
        price: p.price ?? 0,
        category: p.category || '',
        imageUrl: p.image || '',
        stock: p.stock ?? null,
        whatsapp: p.whatsapp || store.whatsapp || '',
      }));

    return NextResponse.json({
      store: {
        id: store.id,
        slug: store.slug || '',
        name: store.name || '',
        logoUrl: store.logoUrl || '',
        coverUrl: store.coverUrl || '',
        beneficiaryName: store.beneficiaryName || '',
        location: store.location || '',
        description: store.description || '',
        phone: store.phone || '',
        whatsapp: store.whatsapp || '',
        socials: store.socials || {},
      },
      products: productsResult,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
