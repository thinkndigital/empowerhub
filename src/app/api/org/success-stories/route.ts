import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { successStories, organizations, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuthToken, DecodedToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

async function resolveOrgId(decoded: DecodedToken): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
  return userRow?.organizationId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const rows = await db.select().from(successStories)
      .where(eq(successStories.organizationId, orgId))
      .orderBy(desc(successStories.createdAt));

    return NextResponse.json({ stories: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const orgName = org?.name || '';

    const body = await req.json();
    const { beneficiaryName, beneficiaryRole, title, content, avatarUrl, stars, status } = body;
    if (!beneficiaryName?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'الاسم ونص القصة مطلوبان' }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(successStories).values({
      id,
      organizationId: orgId,
      orgName,
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryRole: (beneficiaryRole || '').trim(),
      title: (title || '').trim(),
      content: content.trim(),
      avatarUrl: avatarUrl || '',
      stars: Math.min(5, Math.max(1, Number(stars) || 5)),
      status: status === 'published' ? 'published' : 'draft',
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
