import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    if (!orgId) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      orgId = userDoc.data()?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const [storesSnap, productsSnap, ordersSnap] = await Promise.all([
      adminDb.collection('stores').where('organizationId', '==', orgId).get(),
      adminDb.collection('products').where('organizationId', '==', orgId).get(),
      adminDb.collection('orders').where('organizationId', '==', orgId).get(),
    ]);

    const stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    return NextResponse.json({ stores, products, orders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
