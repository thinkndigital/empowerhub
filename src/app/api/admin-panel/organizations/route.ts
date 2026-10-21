import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { organizations } from '@/lib/schema';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await db.select().from(organizations);
  return NextResponse.json({
    orgs: rows.map(({ meta, ...o }) => ({
      ...o,
      ...(meta || {}),
      limitOverrides: { maxUsers: o.maxUsersOverride, maxMentors: o.maxMentorsOverride },
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, plan = 'free', primaryColor = '#6366f1', logoUrl = '', limitOverrides } = body;
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const id = randomUUID();
  await db.insert(organizations).values({
    id, name, planKey: plan, primaryColor, logoUrl,
    maxUsersOverride: limitOverrides?.maxUsers ?? null,
    maxMentorsOverride: limitOverrides?.maxMentors ?? null,
  });
  return NextResponse.json({ id, name, plan, primaryColor, logoUrl });
}
