import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const rows = await db.select().from(notifications)
      .where(eq(notifications.userId, uid))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return NextResponse.json({
      notifications: rows.map(n => ({
        id: n.id,
        type: n.type || '',
        title: n.title || '',
        body: n.body || '',
        read: n.read || false,
        createdAt: n.createdAt?.toISOString?.() || new Date().toISOString(),
        link: n.link || '',
      })),
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const body = await req.json();

    if (body.all) {
      await db.update(notifications).set({ read: true })
        .where(and(eq(notifications.userId, uid), eq(notifications.read, false)));
    } else if (body.id) {
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, body.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
