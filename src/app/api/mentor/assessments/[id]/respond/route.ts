import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { assessments, assessmentTargets, assessmentResponses } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, params.id)).limit(1);
    if (!assessment) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const [target] = await db.select().from(assessmentTargets)
      .where(and(eq(assessmentTargets.assessmentId, params.id), eq(assessmentTargets.targetId, uid), eq(assessmentTargets.targetRole, 'mentor')))
      .limit(1);
    if (!target) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const [existing] = await db.select().from(assessmentResponses)
      .where(and(
        eq(assessmentResponses.assessmentId, params.id),
        eq(assessmentResponses.respondentId, uid),
        eq(assessmentResponses.respondentRole, 'mentor'),
      )).limit(1);
    if (existing) return NextResponse.json({ error: 'لقد أجبت على هذا النموذج مسبقاً' }, { status: 409 });

    const { answers, respondentInfo } = await req.json();
    await db.insert(assessmentResponses).values({
      id: randomUUID(),
      assessmentId: params.id,
      respondentId: uid,
      respondentRole: 'mentor',
      organizationId: assessment.organizationId,
      answers,
      respondentInfo: respondentInfo || null,
    });

    await db.update(assessments).set({ responsesCount: sql`${assessments.responsesCount} + 1` }).where(eq(assessments.id, params.id));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
