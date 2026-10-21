import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, stripPassword } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [userRow] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    const mentorId = userRow?.mentorId;
    if (!mentorId) return NextResponse.json({ mentor: null });

    const [mentor] = await db.select().from(users).where(eq(users.id, mentorId)).limit(1);
    if (!mentor) return NextResponse.json({ mentor: null });

    return NextResponse.json({ mentor: stripPassword(mentor) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
