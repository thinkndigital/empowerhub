import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { role, status, organizationId, name } = body;

  const updates: Record<string, any> = {};
  if (name) updates.name = name;
  if (status) updates.status = status;
  if (organizationId !== undefined) updates.organizationId = organizationId;
  if (role) {
    updates.role = role;
    try {
      const existing = await adminAuth.getUser(params.id);
      const currentClaims = existing.customClaims || {};
      await adminAuth.setCustomUserClaims(params.id, { ...currentClaims, role });
    } catch {}
  }

  await adminDb.collection('users').doc(params.id).update(updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await Promise.all([
    adminDb.collection('users').doc(params.id).delete(),
    adminAuth.deleteUser(params.id).catch(() => {}),
  ]);
  return NextResponse.json({ ok: true });
}
