import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { subscriptions, plans, organizations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET(req: NextRequest, { params }: { params: { orgId: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, params.orgId)).limit(1);
  return NextResponse.json({ subscription: sub || null });
}

export async function PATCH(req: NextRequest, { params }: { params: { orgId: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  // set+merge semantics: create the subscription row if it doesn't exist yet.
  await db.insert(subscriptions)
    .values({ organizationId: params.orgId, ...body })
    .onDuplicateKeyUpdate({ set: body });

  // Also update plan on the org row
  if (body.planId) {
    const [plan] = await db.select().from(plans).where(eq(plans.id, body.planId)).limit(1);
    if (plan) {
      await db.update(organizations).set({ planKey: plan.key || body.planId }).where(eq(organizations.id, params.orgId));
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { orgId: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await db.delete(subscriptions).where(eq(subscriptions.organizationId, params.orgId));
  return NextResponse.json({ ok: true });
}
