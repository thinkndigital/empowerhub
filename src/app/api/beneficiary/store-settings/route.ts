import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// إنشاء متجر جديد
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};

    const body = await req.json();
    const { id: _id, ...data } = body;

    const storeData = {
      ...data,
      beneficiaryId: uid,
      beneficiaryName: userData.name || '',
      organizationId: userData.organizationId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await adminDb.collection('stores').add(storeData);
    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// تحديث متجر موجود
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

    // تأكد أن المتجر تابع لهذا المستفيد
    const storeDoc = await adminDb.collection('stores').doc(id).get();
    if (!storeDoc.exists || storeDoc.data()?.beneficiaryId !== uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await adminDb.collection('stores').doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
