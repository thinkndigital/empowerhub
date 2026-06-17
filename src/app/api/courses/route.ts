import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('courses').where('createdBy', '==', decoded.uid).get();
    const courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ courses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = decoded.organizationId as string | undefined;
    const body = await req.json();
    const ref = await adminDb.collection('courses').add({
      ...body,
      createdBy: decoded.uid,
      organizationId: orgId || null,
      status: 'draft',
      enrolledCount: 0,
      completionRate: 0,
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
    await adminAuth.verifyIdToken(token);
    const { id, ...fields } = await req.json();
    await adminDb.collection('courses').doc(id).update(fields);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    await adminDb.collection('courses').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
