import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('stores').where('beneficiaryId', '==', decoded.uid).limit(1).get();
    if (snap.empty) return NextResponse.json({ store: null });
    const doc = snap.docs[0];
    return NextResponse.json({ store: { id: doc.id, ...doc.data() } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'اسم المتجر مطلوب' }, { status: 400 });
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnap.data() || {};
    const ref = await adminDb.collection('stores').add({
      ...body,
      beneficiaryId: decoded.uid,
      beneficiaryName: userData.name || '',
      organizationId: userData.organizationId || '',
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const doc = await adminDb.collection('stores').doc(id).get();
    if (!doc.exists || doc.data()?.beneficiaryId !== decoded.uid)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await adminDb.collection('stores').doc(id).update({ ...fields, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
