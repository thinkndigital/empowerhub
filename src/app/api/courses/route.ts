import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const allParam = req.nextUrl.searchParams.get('all');

    if (allParam === 'true') {
      // Both Arabic and English published statuses
      const [arSnap, enSnap] = await Promise.all([
        adminDb.collection('courses').where('status', '==', 'منشورة').get(),
        adminDb.collection('courses').where('status', '==', 'published').get(),
      ]);
      const seen = new Set<string>();
      const allDocs: any[] = [];
      for (const d of [...arSnap.docs, ...enSnap.docs]) {
        if (!seen.has(d.id)) { seen.add(d.id); allDocs.push(d); }
      }
      const courses = await Promise.all(allDocs.map(async (d) => {
        const enrollSnap = await adminDb.collection('courses').doc(d.id).collection('enrollments').get();
        const enrollments = enrollSnap.docs.map(e => ({
          userId: e.id, enrolledAt: e.data().enrolledAt, progress: e.data().progress ?? 0,
        }));
        return { id: d.id, ...d.data(), enrolledCount: enrollments.length, enrollments };
      }));
      return NextResponse.json({ courses });
    }

    const snap = await adminDb.collection('courses').where('createdBy', '==', decoded.uid).get();
    const courses = await Promise.all(snap.docs.map(async (d) => {
      const enrollSnap = await adminDb.collection('courses').doc(d.id).collection('enrollments').get();
      const enrollments = enrollSnap.docs.map(e => ({
        userId: e.id, enrolledAt: e.data().enrolledAt, progress: e.data().progress ?? 0,
      }));
      return { id: d.id, ...d.data(), enrolledCount: enrollments.length, enrollments };
    }));
    return NextResponse.json({ courses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    const body = await req.json();
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!orgId) orgId = userDoc.data()?.organizationId;
    const coachName = userDoc.data()?.name || '';

    const ref = await adminDb.collection('courses').add({
      ...body,
      createdBy: decoded.uid,
      coachName,
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
