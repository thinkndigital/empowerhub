import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await adminDb.collection('products').doc(params.id).get();
    if (!doc.exists || doc.data()?.hidden) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    }

    const data = doc.data()!;
    let storeName = data.storeName || '';
    let location = data.location || '';
    if (!storeName && (data.beneficiaryId || data.userId)) {
      const storeSnap = await adminDb.collection('stores')
        .where('beneficiaryId', '==', data.beneficiaryId || data.userId)
        .limit(1)
        .get();
      if (!storeSnap.empty) {
        storeName = storeSnap.docs[0].data().name || '';
        location = location || storeSnap.docs[0].data().location || '';
      }
    }

    return NextResponse.json({
      product: {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price ?? 0,
        deliveryCost: data.deliveryCost || 0,
        category: data.category || '',
        imageUrl: data.imageUrl || '',
        stock: data.stock ?? null,
        whatsapp: data.whatsapp || '',
        location,
        beneficiaryId: data.beneficiaryId || data.userId || '',
        beneficiaryName: data.beneficiaryName || '',
        organizationId: data.organizationId || '',
        storeId: data.userId || data.storeId || '',
        storeName,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
