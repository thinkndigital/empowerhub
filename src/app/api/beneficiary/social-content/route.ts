import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const snap = await adminDb
      .collection('socialContent')
      .where('beneficiaryId', '==', decoded.uid)
      .get();

    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }))
      .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();

    const { title, type, mediaUrl, mediaUrls } = body;
    if (!mediaUrl || (type !== 'image' && type !== 'video')) {
      return NextResponse.json({ error: 'بيانات المحتوى غير مكتملة' }, { status: 400 });
    }

    const ref = await adminDb.collection('socialContent').add({
      beneficiaryId: decoded.uid,
      title: title || '',
      type,
      mediaUrl,
      ...(Array.isArray(mediaUrls) && mediaUrls.length ? { mediaUrls } : {}),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'المعرّف مفقود' }, { status: 400 });

    const docRef = adminDb.collection('socialContent').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.beneficiaryId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
