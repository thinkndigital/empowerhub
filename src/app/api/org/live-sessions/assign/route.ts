import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { users, liveSessions, liveSessionRegistrations } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [caller] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const orgId = caller?.organizationId || decoded.organizationId || '';
    if (!orgId || caller?.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { sessionId, beneficiaryIds } = await req.json();
    if (!sessionId || !beneficiaryIds?.length) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, sessionId)).limit(1);
    if (!session) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });

    const beneficiaryRows = await db.select().from(users).where(inArray(users.id, beneficiaryIds));
    const byId = new Map(beneficiaryRows.map(u => [u.id, u]));

    const existing = await db.select().from(liveSessionRegistrations)
      .where(and(eq(liveSessionRegistrations.sessionId, sessionId), inArray(liveSessionRegistrations.userId, beneficiaryIds)));
    const existingUserIds = new Set(existing.map(r => r.userId));

    const toInsert = beneficiaryIds
      .filter((uid: string) => !existingUserIds.has(uid))
      .map((uid: string) => {
        const u = byId.get(uid);
        return {
          id: randomUUID(),
          sessionId,
          userId: uid,
          name: u?.name || '',
          email: u?.email || '',
          phone: u?.phone || '',
          paymentStatus: 'free' as const,
          assignedBy: decoded.uid,
        };
      });

    if (toInsert.length) {
      await db.insert(liveSessionRegistrations).values(toInsert);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
