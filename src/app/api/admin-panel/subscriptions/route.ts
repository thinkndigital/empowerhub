import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { organizations, subscriptions } from '@/lib/schema';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [orgRows, subRows] = await Promise.all([
    db.select().from(organizations),
    db.select().from(subscriptions),
  ]);

  const subsByOrg = new Map(subRows.map(s => [s.organizationId, s]));

  const result = orgRows.map(o => ({
    org: { id: o.id, name: o.name, plan: o.planKey },
    subscription: subsByOrg.get(o.id) || null,
  }));

  return NextResponse.json({ subscriptions: result });
}
