import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const [storeSnap, productsSnap, ordersSnap] = await Promise.all([
      adminDb.collection('stores').where('beneficiaryId', '==', uid).limit(1).get(),
      adminDb.collection('products').where('beneficiaryId', '==', uid).get(),
      adminDb.collection('orders').where('beneficiaryId', '==', uid).get(),
    ]);

    const store = storeSnap.empty ? null : { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ store, products, orders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// إضافة منتج جديد
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const body = await req.json();

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};

    const productData = {
      ...body,
      beneficiaryId: uid,
      beneficiaryName: userData.name || '',
      organizationId: userData.organizationId || '',
      createdAt: new Date().toISOString(),
    };

    delete productData.id;

    const ref = await adminDb.collection('products').add(productData);
    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// تعديل منتج أو تحديث حالة طلب
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const { id, _collection, ...fields } = body;

    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

    const col = _collection === 'orders' ? 'orders' : 'products';
    delete fields.id;

    await adminDb.collection(col).doc(id).update({ ...fields, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// حذف منتج أو طلب
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    const type = req.nextUrl.searchParams.get('type') || 'product';
    const col = type === 'order' ? 'orders' : 'products';
    await adminDb.collection(col).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
