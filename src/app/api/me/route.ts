import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

// Used by the client's useUser() hook on page load to restore a session from
// a stored token — replaces Firebase's onAuthStateChanged + Firestore profile
// subscription combo.
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const decoded = await verifyAuthToken(idToken);
    const [user] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { passwordHash, ...profile } = user;
    return NextResponse.json({ user: { ...profile, uid: user.id } });
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
