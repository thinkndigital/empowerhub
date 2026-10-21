import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { plans } from '@/lib/schema';
import { asc, count, eq } from 'drizzle-orm';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await db.select().from(plans).orderBy(asc(plans.sortOrder));
  return NextResponse.json({ plans: rows });
}

export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const [{ c }] = await db.select({ c: count() }).from(plans);
  const id = randomUUID();
  await db.insert(plans).values({ ...body, id, sortOrder: c });
  return NextResponse.json({ id, ...body });
}
