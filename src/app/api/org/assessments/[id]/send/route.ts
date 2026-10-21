import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { assessments, assessmentTargets, users, notifications } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { verifyAuthToken, DecodedToken } from '@/lib/auth-server';
import { checkOrgLocked } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

async function getOrgId(decoded: DecodedToken): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
  return userRow?.organizationId || null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const lockCheck = await checkOrgLocked(orgId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: 'إرسال نماذج التقييم ميزة مدفوعة — يرجى الاشتراك أو التجديد للمتابعة.' }, { status: 403 });
    }

    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, params.id)).limit(1);
    if (!assessment || assessment.organizationId !== orgId)
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const body = await req.json();
    const beneficiaryIds: string[] = body.beneficiaryIds || [];
    const coachIds: string[] = body.coachIds || [];
    const mentorIds: string[] = body.mentorIds || [];

    const allIds = [...beneficiaryIds, ...coachIds, ...mentorIds];
    if (allIds.length === 0)
      return NextResponse.json({ error: 'لم يتم تحديد أي مستلم' }, { status: 400 });

    const existingTargets = allIds.length
      ? await db.select().from(assessmentTargets)
          .where(and(eq(assessmentTargets.assessmentId, params.id), inArray(assessmentTargets.targetId, allIds)))
      : [];
    const existingIds = new Set(existingTargets.map(t => t.targetId));

    const toInsert: { role: 'beneficiary' | 'coach' | 'mentor'; id: string }[] = [
      ...beneficiaryIds.filter(id => !existingIds.has(id)).map(id => ({ role: 'beneficiary' as const, id })),
      ...coachIds.filter(id => !existingIds.has(id)).map(id => ({ role: 'coach' as const, id })),
      ...mentorIds.filter(id => !existingIds.has(id)).map(id => ({ role: 'mentor' as const, id })),
    ];

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    await db.insert(assessmentTargets).values(
      toInsert.map(t => ({ assessmentId: params.id, targetId: t.id, targetRole: t.role }))
    );
    await db.update(assessments).set({ status: 'active' }).where(eq(assessments.id, params.id));

    const messageFor = (role: string) => role === 'beneficiary'
      ? `لديك نموذج تقييم "${assessment.title}" من ${assessment.orgName || 'المنظمة'}`
      : `طُلب منك ملء نموذج تقييم "${assessment.title}" من ${assessment.orgName || 'المنظمة'}`;

    await db.insert(notifications).values(
      toInsert.map(t => ({
        id: randomUUID(),
        userId: t.id,
        type: 'assessment',
        title: 'نموذج تقييم جديد',
        body: messageFor(t.role),
        link: `/${t.role}-dashboard/assessments`,
        read: false,
      }))
    );

    return NextResponse.json({ success: true, sent: toInsert.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
