import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const decoded = await verifyAuthToken(idToken);

    // Matches the break-glass admin login in /api/login — resolve without
    // touching the database.
    if (decoded.uid === 'env-admin') {
      return NextResponse.json({ role: 'admin', organizationId: undefined });
    }

    // role/organizationId live directly on the users row (no separate claims
    // store to drift out of sync with, unlike the old Firebase Auth claims +
    // Firestore doc setup) — just read the current values straight from it.
    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);

    return NextResponse.json({
      role: userRow?.role || 'beneficiary',
      organizationId: userRow?.organizationId || undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ role: 'beneficiary' });
  }
}
