import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { conversations, conversationParticipants, messages } from '@/lib/schema';
import { and, asc, desc, eq, ne } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { convId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;
    const { convId } = params;

    const rows = await db.select().from(messages).where(eq(messages.conversationId, convId)).orderBy(asc(messages.createdAt));

    const result = rows.map(m => ({
      id: m.id,
      senderId: m.senderId || '',
      content: m.content || '',
      read: m.read || false,
      createdAt: m.createdAt?.toISOString?.() || new Date().toISOString(),
    }));

    const unreadIds = rows.filter(m => m.senderId !== uid && !m.read).map(m => m.id);
    if (unreadIds.length) {
      await db.update(messages).set({ read: true })
        .where(and(eq(messages.conversationId, convId), ne(messages.senderId, uid), eq(messages.read, false)));
      await db.update(conversationParticipants).set({ unreadCount: 0 })
        .where(and(eq(conversationParticipants.conversationId, convId), eq(conversationParticipants.userId, uid)));
    }

    return NextResponse.json({ messages: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { convId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;
    const { convId } = params;

    const [myPart] = await db.select().from(conversationParticipants)
      .where(and(eq(conversationParticipants.conversationId, convId), eq(conversationParticipants.userId, uid))).limit(1);
    if (!myPart) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const msgId = searchParams.get('msgId');

    if (msgId) {
      const [msg] = await db.select().from(messages).where(eq(messages.id, msgId)).limit(1);
      if (!msg) return NextResponse.json({ error: 'not found' }, { status: 404 });
      if (msg.senderId !== uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

      await db.delete(messages).where(eq(messages.id, msgId));

      const [last] = await db.select().from(messages).where(eq(messages.conversationId, convId)).orderBy(desc(messages.createdAt)).limit(1);
      await db.update(conversations).set({ lastMessage: last?.content || '' }).where(eq(conversations.id, convId));
    } else {
      await db.delete(messages).where(eq(messages.conversationId, convId));
      await db.delete(conversationParticipants).where(eq(conversationParticipants.conversationId, convId));
      await db.delete(conversations).where(eq(conversations.id, convId));
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
