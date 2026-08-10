import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { resolveMerchantScope, hasMerchantPermission } from '@/lib/merchant-scope';

function normalizeDate(date: any): string | undefined {
  if (!date || typeof date === 'string') return date;
  if (date._seconds || date.seconds) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
  return date;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const scope = await resolveMerchantScope(decoded.uid);

    const [storeSnap, productsSnap, ordersSnap] = await Promise.all([
      adminDb.collection('stores').where('beneficiaryId', '==', scope.merchantId).limit(1).get(),
      adminDb.collection('products').where('beneficiaryId', '==', scope.merchantId).get(),
      adminDb.collection('orders').where('beneficiaryId', '==', scope.merchantId).get(),
    ]);

    const store = storeSnap.empty ? null : { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
    const products = productsSnap.docs.map(d => {
      const data = d.data();
      return { id: d.id, ...data, createdAt: normalizeDate(data.createdAt) };
    });
    const orders = ordersSnap.docs.map(d => {
      const data = d.data();
      return { id: d.id, ...data, createdAt: normalizeDate(data.createdAt) };
    });

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
    const scope = await resolveMerchantScope(decoded.uid);
    if (!hasMerchantPermission(scope, 'inventory')) {
      return NextResponse.json({ error: 'لا تملك صلاحية إدارة المخزون' }, { status: 403 });
    }

    const body = await req.json();

    const ownerDoc = await adminDb.collection('users').doc(scope.merchantId).get();
    const ownerData = ownerDoc.data() || {};

    const productData = {
      ...body,
      beneficiaryId: scope.merchantId,
      beneficiaryName: ownerData.name || scope.merchantName,
      organizationId: ownerData.organizationId || '',
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
    const decoded = await adminAuth.verifyIdToken(token);
    const scope = await resolveMerchantScope(decoded.uid);

    const body = await req.json();
    const { id, _collection, ...fields } = body;

    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

    const col = _collection === 'orders' ? 'orders' : 'products';
    if (!hasMerchantPermission(scope, col === 'orders' ? 'orders' : 'inventory')) {
      return NextResponse.json({ error: 'لا تملك الصلاحية اللازمة' }, { status: 403 });
    }

    const docRef = adminDb.collection(col).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.beneficiaryId !== scope.merchantId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    delete fields.id;

    await docRef.update({ ...fields, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// حذف منتج أو طلب
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const scope = await resolveMerchantScope(decoded.uid);

    const id = req.nextUrl.searchParams.get('id') || '';
    const type = req.nextUrl.searchParams.get('type') || 'product';
    const col = type === 'order' ? 'orders' : 'products';
    if (!hasMerchantPermission(scope, col === 'orders' ? 'orders' : 'inventory')) {
      return NextResponse.json({ error: 'لا تملك الصلاحية اللازمة' }, { status: 403 });
    }

    const docRef = adminDb.collection(col).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.beneficiaryId !== scope.merchantId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
