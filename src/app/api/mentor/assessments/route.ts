import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await adminDb.collection('assessments')
      .where('sentToMentors', 'array-contains', uid)
      .where('status', '==', 'active')
      .get();

    const respSnap = await adminDb.collection('assessment-responses')
      .where('respondentId', '==', uid)
      .where('respondentRole', '==', 'mentor')
      .get();

    const submitted = new Set(respSnap.docs.map(d => d.data().assessmentId));

    const assessments = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title, description: data.description, type: data.type,
        questions: data.questions || [],
        orgName: data.orgName, orgLogo: data.orgLogo, orgColor: data.orgColor,
        createdAt: data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : null,
        submitted: submitted.has(d.id),
      };
    });

    return NextResponse.json({ assessments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
