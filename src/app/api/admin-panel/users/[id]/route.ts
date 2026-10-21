import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
  if (role) updates.role = role;

  await db.update(users).set(updates).where(eq(users.id, params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(users).where(eq(users.id, params.id));
  return NextResponse.json({ ok: true });
}
