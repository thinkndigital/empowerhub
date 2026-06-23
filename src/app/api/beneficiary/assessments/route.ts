import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Assessments sent to this beneficiary — filter status in memory to avoid composite index
    const snap = await adminDb.collection('assessments')
      .where('sentTo', 'array-contains', uid)
      .get();

    // Get submitted responses for this user
    const respSnap = await adminDb.collection('assessment-responses')
      .where('beneficiaryId', '==', uid).get();

    const submittedMap: Record<string, string[]> = {};
    respSnap.docs.forEach(d => {
      const data = d.data();
      if (!submittedMap[data.assessmentId]) submittedMap[data.assessmentId] = [];
      submittedMap[data.assessmentId].push(data.phase);
    });

    const assessments = snap.docs
      .filter(d => d.data().status !== 'draft' && d.data().status !== 'closed')
      .map(d => {
      const data = d.data();
      const submitted = submittedMap[d.id] || [];
      return {
        id: d.id,
        title: data.title,
        description: data.description,
        type: data.type,
        questions: data.questions || [],
        orgName: data.orgName,
        orgLogo: data.orgLogo,
        orgColor: data.orgColor,
        createdAt: data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : null,
        submittedPhases: submitted,
      };
    });

    return NextResponse.json({ assessments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
