import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

function normalizeDate(date: any): string | undefined {
  if (!date || typeof date === 'string') return date;
  if (date._seconds || date.seconds) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'stores';

  if (type === 'orders') {
    const snap = await adminDb.collection('orders').get();
    const orders = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        productName: data.productName || '',
        storeName: data.storeName || '',
        buyerName: data.buyerName || '',
        buyerPhone: data.buyerPhone || '',
        buyerAddress: data.buyerAddress || '',
        totalAmount: data.totalAmount || 0,
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod || 'cod',
        paymentStatus: data.paymentStatus || 'unpaid',
        createdAt: normalizeDate(data.createdAt),
      };
    });
    orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return NextResponse.json({ orders });
  }

  if (type === 'products') {
    const snap = await adminDb.collection('products').get();
    const products = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        price: data.price,
        category: data.category,
        status: data.status,
        hidden: data.hidden ?? false,
        imageUrl: data.imageUrl || data.image || '',
        userId: data.userId,
        storeId: data.storeId,
        createdAt: normalizeDate(data.createdAt),
      };
    });
    return NextResponse.json({ products });
  }

  // stores (default)
  const storesSnap = await adminDb.collection('stores').get();
  const stores = await Promise.all(storesSnap.docs.map(async d => {
    const data = d.data();
    const productsSnap = await adminDb.collection('products').where('storeId', '==', d.id).count().get();
    let beneficiaryName = data.beneficiaryName || '';
    if (!beneficiaryName && data.beneficiaryId) {
      const userSnap = await adminDb.collection('users').doc(data.beneficiaryId).get();
      if (userSnap.exists) beneficiaryName = (userSnap.data() as any)?.name || '';
    }
    return {
      id: d.id,
      name: data.name,
      logoUrl: data.logoUrl || '',
      location: data.location || '',
      beneficiaryName,
      beneficiaryId: data.beneficiaryId || '',
      organizationId: data.organizationId || '',
      hidden: data.hidden ?? false,
      productsCount: productsSnap.data().count,
      createdAt: normalizeDate(data.createdAt),
    };
  }));

  return NextResponse.json({ stores });
}
