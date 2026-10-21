import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { payouts } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const rows = userId
      ? await db.select().from(payouts).where(eq(payouts.userId, userId)).orderBy(desc(payouts.createdAt))
      : await db.select().from(payouts).orderBy(desc(payouts.createdAt));

    return NextResponse.json({ payouts: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, userName, userRole, amount, grossAmount, commissionAmount, orderIds, transferReference, notes } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: 'بيانات ناقصة: userId و amount مطلوبان' }, { status: 400 });
    }

    const id = randomUUID();
    const newPayout = {
      id,
      userId,
      userName: userName || '',
      userRole: userRole || '',
      amount: String(Number(amount)),
      grossAmount: String(Number(grossAmount ?? amount)),
      commissionAmount: String(Number(commissionAmount ?? 0)),
      orderIds: orderIds || [],
      status: 'pending' as const,
      transferReference: transferReference || '',
      notes: notes || '',
    };

    await db.insert(payouts).values(newPayout);

    return NextResponse.json({ ok: true, id, payout: { ...newPayout, createdAt: new Date().toISOString() } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, transferReference } = body;

    if (!id) {
      return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });
    }

    const [payout] = await db.select().from(payouts).where(eq(payouts.id, id)).limit(1);
    if (!payout) {
      return NextResponse.json({ error: 'التحويل غير موجود' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (status === 'paid') updates.paidAt = new Date();
    if (transferReference !== undefined) updates.transferReference = transferReference;

    await db.update(payouts).set(updates).where(eq(payouts.id, id));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
