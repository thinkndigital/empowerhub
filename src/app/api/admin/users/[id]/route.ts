import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    if (decoded.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { role, status } = await req.json();
    const updates: Record<string, any> = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'لا يوجد ما يتم تحديثه' }, { status: 400 });
    }

    await db.update(users).set(updates).where(eq(users.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
