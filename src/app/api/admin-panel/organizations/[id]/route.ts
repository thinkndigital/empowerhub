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

  const { meta, ...orgRest } = org;
  return NextResponse.json({
    org: { ...orgRest, ...(meta || {}), limitOverrides: { maxUsers: org.maxUsersOverride, maxMentors: org.maxMentorsOverride } },
    usersCount,
    coursesCount,
  });
}

// Real columns on the organizations table — anything else in the PATCH body
// (orgType, features, dashboardSections, ...) is stored in organizations.meta
// and flattened back out by GET above, since the org admin UI reads/writes
// these as plain top-level org fields.
const REAL_COLUMNS = new Set([
  'name', 'adminId', 'status', 'planKey', 'inviteCode', 'primaryColor', 'logoUrl',
  'courseSessionPrice', 'mentorshipSessionPrice', 'maxUsersOverride', 'maxMentorsOverride',
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { limitOverrides, plan, ...rest } = body;

  const updates: Record<string, any> = {};
  const metaPatch: Record<string, any> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (REAL_COLUMNS.has(key)) updates[key] = value;
    else metaPatch[key] = value;
  }

  if (plan !== undefined) updates.planKey = plan;
  if (limitOverrides !== undefined) {
    updates.maxUsersOverride = limitOverrides?.maxUsers ?? null;
    updates.maxMentorsOverride = limitOverrides?.maxMentors ?? null;
  }

  if (Object.keys(metaPatch).length) {
    const [existing] = await db.select({ meta: organizations.meta }).from(organizations).where(eq(organizations.id, params.id)).limit(1);
    updates.meta = { ...(existing?.meta || {}), ...metaPatch };
  }

  await db.update(organizations).set(updates).where(eq(organizations.id, params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(organizations).where(eq(organizations.id, params.id));
  return NextResponse.json({ ok: true });
}
