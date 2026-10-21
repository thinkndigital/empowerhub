import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { conversations, conversationParticipants, messages, notifications, users, userBlocks } from '@/lib/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const myParts = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, uid));
    const convIds = myParts.map(p => p.conversationId);
    if (!convIds.length) return NextResponse.json({ conversations: [] });

    const convRows = await db.select().from(conversations).where(inArray(conversations.id, convIds));
    const allParts = await db.select().from(conversationParticipants).where(inArray(conversationParticipants.conversationId, convIds));

    const otherIds = Array.from(new Set(allParts.filter(p => p.userId !== uid).map(p => p.userId)));
    const otherUsers = otherIds.length ? await db.select().from(users).where(inArray(users.id, otherIds)) : [];
    const userById = new Map(otherUsers.map(u => [u.id, u]));

    const myPartByConv = new Map(myParts.map(p => [p.conversationId, p]));
    const otherPartByConv = new Map(allParts.filter(p => p.userId !== uid).map(p => [p.conversationId, p]));

    const result = convRows.map(c => {
      const otherPart = otherPartByConv.get(c.id);
      const otherUser = otherPart ? userById.get(otherPart.userId) : undefined;
      return {
        id: c.id,
        participants: allParts.filter(p => p.conversationId === c.id).map(p => p.userId),
        lastMessage: c.lastMessage || '',
        lastUpdated: c.lastUpdated?.toISOString?.() || null,
        unreadCount: myPartByConv.get(c.id)?.unreadCount || 0,
        otherUser: otherUser
          ? { id: otherUser.id, name: otherUser.name || 'مستخدم', role: otherUser.role || '' }
          : { id: otherPart?.userId || '', name: 'مستخدم', role: '' },
      };
    }).sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));

    return NextResponse.json({ conversations: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const { toUserId, content } = await req.json();
    if (!toUserId) return NextResponse.json({ error: 'toUserId is required' }, { status: 400 });

    const [blocked] = await db.select().from(userBlocks)
      .where(and(eq(userBlocks.blockerId, toUserId), eq(userBlocks.blockedId, uid))).limit(1);
    if (blocked) {
      return NextResponse.json({ error: 'تعذر إرسال الرسالة' }, { status: 403 });
    }

    const myConvIds = (await db.select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants).where(eq(conversationParticipants.userId, uid))).map(r => r.conversationId);
    const otherConvIds = (await db.select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants).where(eq(conversationParticipants.userId, toUserId))).map(r => r.conversationId);
    const existingConvId = myConvIds.find(id => otherConvIds.includes(id));

    let convId: string;
    if (existingConvId) {
      convId = existingConvId;
    } else {
      convId = randomUUID();
      await db.insert(conversations).values({ id: convId, lastMessage: '' });
      await db.insert(conversationParticipants).values([
        { conversationId: convId, userId: uid, unreadCount: 0 },
        { conversationId: convId, userId: toUserId, unreadCount: 0 },
      ]);
    }

    let messageId = '';
    const text = content?.trim() || '';
    if (text) {
      const [sender] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
      const senderName = sender?.name || 'مستخدم';

      messageId = randomUUID();
      await db.insert(messages).values({ id: messageId, conversationId: convId, senderId: uid, content: text, read: false });

      await db.update(conversations).set({ lastMessage: text }).where(eq(conversations.id, convId));
      await db.update(conversationParticipants)
        .set({ unreadCount: sql`${conversationParticipants.unreadCount} + 1` })
        .where(and(eq(conversationParticipants.conversationId, convId), eq(conversationParticipants.userId, toUserId)));

      await db.insert(notifications).values({
        id: randomUUID(),
        userId: toUserId,
        type: 'message',
        title: `رسالة جديدة من ${senderName}`,
        body: text.slice(0, 100),
        link: '/messages',
        read: false,
      });
    }

    return NextResponse.json({ conversationId: convId, messageId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
