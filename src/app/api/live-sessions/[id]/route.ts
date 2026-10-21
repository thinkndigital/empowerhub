import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { liveSessions, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, params.id)).limit(1);
    if (!session || session.coachId !== decoded.uid) {
      return NextResponse.json({ error: 'غير موجود أو غير مصرح' }, { status: 404 });
    }

    const body = await req.json();
    const update: Record<string, any> = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.coverImageUrl !== undefined) update.coverImageUrl = body.coverImageUrl;
    if (body.date !== undefined) update.date = new Date(body.date);
    if (body.duration !== undefined) update.duration = String(body.duration);
    if (body.meetLink !== undefined) update.meetLink = body.meetLink;
    if (body.price !== undefined) update.price = String(Number(body.price));
    if (body.maxParticipants !== undefined) update.maxParticipants = body.maxParticipants ? Number(body.maxParticipants) : null;
    if (body.status !== undefined) update.status = body.status;

    await db.update(liveSessions).set(update).where(eq(liveSessions.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, params.id)).limit(1);
    if (!session || session.coachId !== decoded.uid) {
      return NextResponse.json({ error: 'غير موجود أو غير مصرح' }, { status: 404 });
    }

    await db.delete(liveSessions).where(eq(liveSessions.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
