import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { uniqueStoreSlug as uniqueSlug } from '@/lib/store-slug';
import { resolveMerchantScope, hasMerchantPermission } from '@/lib/merchant-scope';

// إنشاء متجر جديد
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const scope = await resolveMerchantScope(decoded.uid);
    if (!hasMerchantPermission(scope, 'store')) {
      return NextResponse.json({ error: 'لا تملك صلاحية إدارة المتجر' }, { status: 403 });
    }

    const userDoc = await adminDb.collection('users').doc(scope.merchantId).get();
    const userData = userDoc.data() || {};

    const body = await req.json();
    const { id: _id, ...data } = body;

    const slug = data.name ? await uniqueSlug(data.name) : '';

    const storeData = {
      ...data,
      slug,
      beneficiaryId: scope.merchantId,
      beneficiaryName: userData.name || '',
      organizationId: userData.organizationId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await adminDb.collection('stores').add(storeData);
    return NextResponse.json({ id: ref.id, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// تحديث متجر موجود
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const scope = await resolveMerchantScope(decoded.uid);
    if (!hasMerchantPermission(scope, 'store')) {
      return NextResponse.json({ error: 'لا تملك صلاحية إدارة المتجر' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

    // تأكد أن المتجر تابع لهذا التاجر
    const storeDoc = await adminDb.collection('stores').doc(id).get();
    if (!storeDoc.exists || storeDoc.data()?.beneficiaryId !== scope.merchantId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // أعد توليد الرابط المخصص فقط إذا تغيّر اسم المتجر
    const existingName = storeDoc.data()?.name || '';
    const slug = data.name && data.name !== existingName
      ? await uniqueSlug(data.name, id)
      : (storeDoc.data()?.slug || (data.name ? await uniqueSlug(data.name, id) : ''));

    await adminDb.collection('stores').doc(id).update({
      ...data,
      slug,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ id, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
