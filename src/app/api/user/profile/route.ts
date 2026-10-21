import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, stripPassword } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (!userRow) return NextResponse.json({ profile: null });

    const profile: Record<string, unknown> = stripPassword(userRow);

    if (userRow.mentorId) {
      const [mentor] = await db.select().from(users).where(eq(users.id, userRow.mentorId)).limit(1);
      if (mentor) profile.mentorName = mentor.name || null;
    }

    if (userRow.coachId) {
      const [coach] = await db.select().from(users).where(eq(users.id, userRow.coachId)).limit(1);
      if (coach) profile.coachName = coach.name || null;
    }

    return NextResponse.json({ profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();
    delete body.passwordHash;
    delete body.id;
    await db.update(users).set(body).where(eq(users.id, decoded.uid));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
