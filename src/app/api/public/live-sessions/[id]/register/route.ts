import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { liveSessions, liveSessionRegistrations } from '@/lib/schema';
import { and, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, params.id)).limit(1);
    if (!session || session.status !== 'published') {
      return NextResponse.json({ error: 'الجلسة غير موجودة أو غير متاحة' }, { status: 404 });
    }

    if (session.maxParticipants) {
      const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(liveSessionRegistrations).where(eq(liveSessionRegistrations.sessionId, params.id));
      if (Number(c) >= session.maxParticipants) {
        return NextResponse.json({ error: 'اكتمل عدد المشاركين' }, { status: 400 });
      }
    }

    const body = await req.json();
    const { name, email, phone } = body;
    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await db.select().from(liveSessionRegistrations)
      .where(and(eq(liveSessionRegistrations.sessionId, params.id), eq(liveSessionRegistrations.email, normalizedEmail))).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'تم تسجيلك مسبقاً في هذه الجلسة' }, { status: 400 });
    }

    await db.insert(liveSessionRegistrations).values({
      id: randomUUID(),
      sessionId: params.id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '',
      paymentStatus: Number(session.price) > 0 ? 'pending' : 'free',
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
