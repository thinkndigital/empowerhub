import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { courses } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const decoded = await verifyAuthToken(token);
  if (decoded.role !== 'admin') throw new Error('Forbidden');
  return decoded;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const { status } = await req.json();
    if (!['draft', 'published'].includes(status)) {
      return NextResponse.json({ error: 'قيمة غير صالحة' }, { status: 400 });
    }
    await db.update(courses).set({ status }).where(eq(courses.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    await db.delete(courses).where(eq(courses.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
