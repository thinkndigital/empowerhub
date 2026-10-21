import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assessments, assessmentTargets, assessmentResponses } from '@/lib/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const targets = await db.select().from(assessmentTargets)
      .where(and(eq(assessmentTargets.targetId, uid), eq(assessmentTargets.targetRole, 'coach')));
    const assessmentIds = targets.map(t => t.assessmentId);
    if (assessmentIds.length === 0) return NextResponse.json({ assessments: [] });

    const rows = await db.select().from(assessments)
      .where(and(inArray(assessments.id, assessmentIds), ne(assessments.status, 'draft')));

    const responses = await db.select().from(assessmentResponses)
      .where(and(eq(assessmentResponses.respondentId, uid), eq(assessmentResponses.respondentRole, 'coach')));
    const submitted = new Set(responses.map(r => r.assessmentId));

    return NextResponse.json({
      assessments: rows.map(a => ({
        id: a.id, title: a.title, description: a.description, type: a.type,
        questions: a.questions || [],
        orgName: a.orgName, orgLogo: a.orgLogo, orgColor: a.orgColor,
        createdAt: a.createdAt,
        submitted: submitted.has(a.id),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
