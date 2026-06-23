import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const assessmentSnap = await adminDb.collection('assessments').doc(params.id).get();
    if (!assessmentSnap.exists) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    const assessment = assessmentSnap.data()!;

    if (!(assessment.sentTo || []).includes(uid))
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { answers, phase, respondentInfo } = await req.json();
    if (!answers || !phase) return NextResponse.json({ error: 'البيانات ناقصة' }, { status: 400 });

    const validPhases = assessment.type === 'both' ? ['pre', 'post'] : [assessment.type === 'pre' ? 'pre' : 'post'];
    if (!validPhases.includes(phase)) return NextResponse.json({ error: 'مرحلة غير صحيحة' }, { status: 400 });

    // Check not already submitted for this phase
    const existing = await adminDb.collection('assessment-responses')
      .where('assessmentId', '==', params.id)
      .where('beneficiaryId', '==', uid)
      .where('phase', '==', phase)
      .get();
    if (!existing.empty) return NextResponse.json({ error: 'لقد أجبت على هذا النموذج مسبقاً' }, { status: 409 });

    await adminDb.collection('assessment-responses').add({
      assessmentId: params.id,
      beneficiaryId: uid,
      organizationId: assessment.organizationId,
      phase,
      answers,
      respondentInfo: respondentInfo || null,
      submittedAt: new Date(),
    });

    // Increment responsesCount
    await adminDb.collection('assessments').doc(params.id).update({
      responsesCount: (assessment.responsesCount || 0) + 1,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
