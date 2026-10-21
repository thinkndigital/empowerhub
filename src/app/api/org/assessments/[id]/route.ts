import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assessments, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken, DecodedToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

async function getOrgId(decoded: DecodedToken): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
  return userRow?.organizationId || null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, params.id)).limit(1);
    if (!assessment || assessment.organizationId !== orgId)
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const body = await req.json();
    await db.update(assessments).set(body).where(eq(assessments.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, params.id)).limit(1);
    if (!assessment || assessment.organizationId !== orgId)
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    await db.delete(assessments).where(eq(assessments.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
