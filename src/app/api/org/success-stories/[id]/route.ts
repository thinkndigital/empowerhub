import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { successStories, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken, DecodedToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

async function resolveOrgId(decoded: DecodedToken): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
  return userRow?.organizationId || null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const [story] = await db.select().from(successStories).where(eq(successStories.id, params.id)).limit(1);
    if (!story || story.organizationId !== orgId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};
    if (body.beneficiaryName !== undefined) updates.beneficiaryName = body.beneficiaryName.trim();
    if (body.beneficiaryRole !== undefined) updates.beneficiaryRole = body.beneficiaryRole.trim();
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.content !== undefined) updates.content = body.content.trim();
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
    if (body.stars !== undefined) updates.stars = Math.min(5, Math.max(1, Number(body.stars) || 5));
    if (body.status !== undefined) updates.status = body.status === 'published' ? 'published' : 'draft';

    await db.update(successStories).set(updates).where(eq(successStories.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const [story] = await db.select().from(successStories).where(eq(successStories.id, params.id)).limit(1);
    if (!story || story.organizationId !== orgId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }

    await db.delete(successStories).where(eq(successStories.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
