import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function getUid(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function POST(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const body = await req.json();

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};

    const storeData = {
      ...body,
      beneficiaryId: uid,
      beneficiaryName: userData.name || '',
      organizationId: userData.organizationId || '',
      createdAt: new Date().toISOString(),
    };

    const ref = await adminDb.collection('stores').add(storeData);
    return NextResponse.json({ id: ref.id, ...storeData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const body = await req.json();
    const { id, ...data } = body;

    const docRef = adminDb.collection('stores').doc(id);
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
