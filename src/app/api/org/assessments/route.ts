import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { assessments, organizations, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuthToken, DecodedToken } from '@/lib/auth-server';
import { checkOrgLocked } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

async function getOrgId(decoded: DecodedToken): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
  return userRow?.organizationId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const rows = await db.select().from(assessments)
      .where(eq(assessments.organizationId, orgId))
      .orderBy(desc(assessments.createdAt));
    return NextResponse.json({ assessments: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const lockCheck = await checkOrgLocked(orgId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: 'إنشاء نماذج التقييم ميزة مدفوعة — يرجى الاشتراك أو التجديد للمتابعة.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, type, questions, status } = body;
    if (!title || !type) return NextResponse.json({ error: 'العنوان ونوع التقييم مطلوبان' }, { status: 400 });

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

    const id = randomUUID();
    await db.insert(assessments).values({
      id, title, description: description || '', type,
      questions: questions || [],
      status: status || 'draft',
      organizationId: orgId,
      createdBy: decoded.uid,
      responsesCount: 0,
      orgName: org?.name || '',
      orgLogo: org?.logoUrl || '',
      orgColor: org?.primaryColor || '',
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
