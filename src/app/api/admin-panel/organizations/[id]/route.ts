import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await adminDb.collection('organizations').doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [usersSnap, coursesSnap] = await Promise.all([
    adminDb.collection('users').where('organizationId', '==', params.id).get(),
    adminDb.collection('courses').where('organizationId', '==', params.id).get(),
  ]);

  return NextResponse.json({
    org: { id: snap.id, ...snap.data() },
    usersCount: usersSnap.size,
    coursesCount: coursesSnap.size,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await adminDb.collection('organizations').doc(params.id).update(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await adminDb.collection('organizations').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
