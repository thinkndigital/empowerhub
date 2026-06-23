import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

async function getOrgId(decoded: any): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  return snap.data()?.organizationId || null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const docRef = adminDb.collection('assessments').doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.organizationId !== orgId)
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const { beneficiaryIds } = await req.json();
    if (!Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0)
      return NextResponse.json({ error: 'لم يتم تحديد أي مستفيد' }, { status: 400 });

    const assessmentData = snap.data()!;
    const existingSentTo: string[] = assessmentData.sentTo || [];
    const newIds = beneficiaryIds.filter((id: string) => !existingSentTo.includes(id));

    if (newIds.length === 0)
      return NextResponse.json({ message: 'تم إرسال النموذج لهؤلاء المستفيدين مسبقاً', sent: 0 });

    const batch = adminDb.batch();

    // Update assessment sentTo and status
    batch.update(docRef, {
      sentTo: FieldValue.arrayUnion(...newIds),
      status: 'active',
    });

    // Create notification for each beneficiary
    for (const uid of newIds) {
      const notifRef = adminDb.collection('notifications').doc();
      batch.set(notifRef, {
        userId: uid,
        type: 'assessment',
        title: 'نموذج تقييم جديد',
        body: `لديك نموذج تقييم "${assessmentData.title}" من ${assessmentData.orgName || 'المنظمة'}`,
        assessmentId: params.id,
        read: false,
        createdAt: new Date(),
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true, sent: newIds.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
