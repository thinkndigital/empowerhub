import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const decoded = await verifyAuthToken(idToken);

    const userRows = await db.select({
      id: users.id, role: users.role, name: users.name, email: users.email, organizationId: users.organizationId,
    }).from(users).limit(30);

    const [currentUser] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);

    return NextResponse.json({
      currentUser: currentUser
        ? { uid: currentUser.id, email: currentUser.email, role: currentUser.role, organizationId: currentUser.organizationId }
        : null,
      users: userRows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
