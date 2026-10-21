import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, ne } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const [caller] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const orgId = caller?.organizationId;

    const rows = orgId
      ? await db.select().from(users).where(eq(users.organizationId, orgId))
      : await db.select().from(users).limit(50);

    const contacts = rows
      .filter(u => u.id !== decoded.uid)
      .map(u => ({ id: u.id, name: u.name || 'مستخدم', role: u.role || '', email: u.email || '' }));
    return NextResponse.json({ contacts });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
