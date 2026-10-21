import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/schema';
import { randomUUID } from 'crypto';

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await verifyAuthToken(token);
  if (decoded.role !== 'admin') throw new Error('Forbidden');
  return decoded;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const rows = await db.select().from(organizations);
    return NextResponse.json({
      orgs: rows.map(({ meta, ...o }) => ({
        ...o,
        ...(meta || {}),
        limitOverrides: { maxUsers: o.maxUsersOverride, maxMentors: o.maxMentorsOverride },
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'Forbidden' ? 403 : 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { name, plan = 'free', primaryColor = '#6366f1', logoUrl = '', limitOverrides, ...rest } = body;
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const id = randomUUID();
    await db.insert(organizations).values({
      id, name, planKey: plan, primaryColor, logoUrl,
      maxUsersOverride: limitOverrides?.maxUsers ?? null,
      maxMentorsOverride: limitOverrides?.maxMentors ?? null,
      meta: Object.keys(rest).length ? rest : null,
    });
    return NextResponse.json({ id, name, plan, primaryColor, logoUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
