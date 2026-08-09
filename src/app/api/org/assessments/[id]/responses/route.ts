import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

async function getOrgId(decoded: any): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  return snap.data()?.organizationId || null;
}

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const assessSnap = await adminDb.collection('assessments').doc(params.id).get();
    if (!assessSnap.exists || assessSnap.data()?.organizationId !== orgId)
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    const assessmentData = assessSnap.data()!;

    const respSnap = await adminDb.collection('assessment-responses')
      .where('assessmentId', '==', params.id)
      .get();

    // Beneficiary responses store `beneficiaryId` + `phase` (pre/post);
    // coach/mentor responses store `respondentId` + `respondentRole`
    // instead, with no phase concept. Normalize both into one shape.
    const rawResponses = respSnap.docs.map(d => {
      const data = d.data();
      const respondentId: string = data.respondentId || data.beneficiaryId;
      const respondentRole: 'beneficiary' | 'coach' | 'mentor' = data.respondentRole || 'beneficiary';
      return {
        id: d.id,
        respondentId,
        respondentRole,
        phase: data.phase || null,
        answers: (data.answers || []) as { questionId: string; value: string | number }[],
        respondentInfo: data.respondentInfo || null,
        submittedAt: normalizeDate(data.submittedAt),
      };
    });

    const uniqueIds = Array.from(new Set(rawResponses.map(r => r.respondentId).filter(Boolean)));
    const userDocs = await Promise.all(uniqueIds.map(id => adminDb.collection('users').doc(id).get()));
    const userMap: Record<string, { name: string; email: string }> = {};
    userDocs.forEach(doc => {
      if (doc.exists) userMap[doc.id] = { name: doc.data()?.name || '', email: doc.data()?.email || '' };
    });

    const responses = rawResponses
      .map(r => ({
        ...r,
        respondentName: userMap[r.respondentId]?.name || r.respondentInfo?.name || 'مستخدم غير معروف',
        respondentEmail: userMap[r.respondentId]?.email || '',
      }))
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));

    return NextResponse.json({
      assessment: {
        id: assessSnap.id,
        title: assessmentData.title,
        description: assessmentData.description,
        type: assessmentData.type,
        questions: assessmentData.questions || [],
        sentTo: assessmentData.sentTo || [],
        sentToCoaches: assessmentData.sentToCoaches || [],
        sentToMentors: assessmentData.sentToMentors || [],
      },
      responses,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
