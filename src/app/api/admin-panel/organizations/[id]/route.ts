import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { organizations, users, courses } from '@/lib/schema';
import { eq, count } from 'drizzle-orm';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [org] = await db.select().from(organizations).where(eq(organizations.id, params.id)).limit(1);
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [[{ c: usersCount }], [{ c: coursesCount }]] = await Promise.all([
    db.select({ c: count() }).from(users).where(eq(users.organizationId, params.id)),
    db.select({ c: count() }).from(courses).where(eq(courses.organizationId, params.id)),
  ]);

  return NextResponse.json({
    org: { ...org, limitOverrides: { maxUsers: org.maxUsersOverride, maxMentors: org.maxMentorsOverride } },
    usersCount,
    coursesCount,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { limitOverrides, plan, ...rest } = body;
  const updates: Record<string, any> = { ...rest };
  if (plan !== undefined) updates.planKey = plan;
  if (limitOverrides !== undefined) {
    updates.maxUsersOverride = limitOverrides?.maxUsers ?? null;
    updates.maxMentorsOverride = limitOverrides?.maxMentors ?? null;
  }

  await db.update(organizations).set(updates).where(eq(organizations.id, params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(organizations).where(eq(organizations.id, params.id));
  return NextResponse.json({ ok: true });
}
