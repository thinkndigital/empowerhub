import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { contactRequests, users, notifications } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const { subject, message } = await req.json();
    if (!subject || !message) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const [sender] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const organizationId = sender?.organizationId || decoded.organizationId || null;

    await db.insert(contactRequests).values({
      id: randomUUID(),
      senderId: decoded.uid,
      senderName: sender?.name || sender?.email || '',
      organizationId,
      subject,
      message,
    });

    if (organizationId) {
      const [orgAdmin] = await db.select().from(users)
        .where(and(eq(users.organizationId, organizationId), eq(users.role, 'organization'))).limit(1);
      if (orgAdmin) {
        await db.insert(notifications).values({
          id: randomUUID(),
          userId: orgAdmin.id,
          title: `طلب جديد: ${subject}`,
          body: `${sender?.name || 'مستفيد'} أرسل طلباً: ${message.slice(0, 80)}`,
          read: false,
          link: '/organization-dashboard/messages',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
