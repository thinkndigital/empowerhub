import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const storeDoc = await adminDb.collection('stores').doc(params.storeId).get();
    if (!storeDoc.exists) {
      return NextResponse.json({ error: 'المتجر غير موجود' }, { status: 404 });
    }

    const storeData = storeDoc.data()!;
    const beneficiaryId = storeData.beneficiaryId || '';

    // Products can be linked via userId==beneficiaryId, beneficiaryId==beneficiaryId,
    // userId==storeId, or storeId==storeId — try all combinations and deduplicate
    const queries = [
      adminDb.collection('products').where('userId', '==', beneficiaryId).get(),
      adminDb.collection('products').where('beneficiaryId', '==', beneficiaryId).get(),
      adminDb.collection('products').where('userId', '==', storeDoc.id).get(),
      adminDb.collection('products').where('storeId', '==', storeDoc.id).get(),
    ];
    const results = await Promise.all(queries);
    const allDocs = results.flatMap(s => s.docs);

    const seen = new Set<string>();
    const products = allDocs
      .filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return !d.data().hidden;
      })
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price ?? 0,
          category: data.category || '',
          imageUrl: data.imageUrl || '',
          stock: data.stock ?? null,
          whatsapp: data.whatsapp || storeData.whatsapp || '',
        };
      });

    return NextResponse.json({
      store: {
        id: storeDoc.id,
        name: storeData.name || '',
        logoUrl: storeData.logoUrl || '',
        beneficiaryName: storeData.beneficiaryName || '',
        location: storeData.location || '',
        description: storeData.description || '',
        whatsapp: storeData.whatsapp || '',
      },
      products,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
