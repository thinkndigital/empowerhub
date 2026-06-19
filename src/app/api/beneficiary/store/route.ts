import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function getUid(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function GET(req: NextRequest) {
  try {
    const uid = await getUid(req);

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

export async function POST(req: NextRequest) {
  try {
    const uid = await getUid(req);
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

    const ref = await adminDb.collection('products').add(productData);
    return NextResponse.json({ id: ref.id, ...productData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const body = await req.json();
    const { id, _collection, ...data } = body;
    const collectionName = _collection || 'products';

    const docRef = adminDb.collection(collectionName).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.beneficiaryId !== uid) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    await docRef.update(data);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const collectionName = searchParams.get('collection') || 'products';

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const docRef = adminDb.collection(collectionName).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.beneficiaryId !== uid) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
