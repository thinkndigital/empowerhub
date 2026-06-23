import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await adminDb.collection('assessments').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    const data = snap.data()!;

    if (!(data.sentToMentors || []).includes(uid))
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const existing = await adminDb.collection('assessment-responses')
      .where('assessmentId', '==', params.id)
      .where('respondentId', '==', uid)
      .where('respondentRole', '==', 'mentor')
      .get();
    if (!existing.empty)
      return NextResponse.json({ error: 'لقد أجبت على هذا النموذج مسبقاً' }, { status: 409 });

    const { answers } = await req.json();
    await adminDb.collection('assessment-responses').add({
      assessmentId: params.id,
      respondentId: uid,
      respondentRole: 'mentor',
      organizationId: data.organizationId,
      answers,
      submittedAt: new Date(),
    });

    await adminDb.collection('assessments').doc(params.id).update({
      responsesCount: (data.responsesCount || 0) + 1,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
