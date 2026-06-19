import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function verifyOwner(token: string, courseId: string): Promise<string> {
  const decoded = await adminAuth.verifyIdToken(token);
  const uid = decoded.uid;
  const courseSnap = await adminDb.collection('courses').doc(courseId).get();
  if (!courseSnap.exists) throw new Error('Course not found');
  const course = courseSnap.data()!;
  if (course.createdBy !== uid) throw new Error('Unauthorized');
  return uid;
}

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);
    const snap = await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('lessons')
      .orderBy('order', 'asc')
      .get();
    const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ lessons });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOwner(token, params.courseId);
    const body = await req.json();
    const ref = await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('lessons')
      .add({
        title: body.title,
        description: body.description || '',
        videoUrl: body.videoUrl || '',
        order: body.order ?? 0,
        createdAt: new Date().toISOString(),
      });
    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOwner(token, params.courseId);
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('lessons')
      .doc(id)
      .set(fields, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOwner(token, params.courseId);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await adminDb
      .collection('courses')
      .doc(params.courseId)
      .collection('lessons')
      .doc(id)
      .delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
