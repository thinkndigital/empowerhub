import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const role = searchParams.get('role');

  const conditions = [];
  if (orgId) conditions.push(eq(users.organizationId, orgId));
  if (role) conditions.push(eq(users.role, role as any));

  const rows = conditions.length
    ? await db.select().from(users).where(and(...conditions))
    : await db.select().from(users);

  return NextResponse.json({
    users: rows.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role, organizationId: u.organizationId,
      status: u.status, avatarUrl: u.avatarUrl, createdAt: u.createdAt,
    })),
  });
}
