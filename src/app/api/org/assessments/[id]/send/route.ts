import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkOrgLocked } from '@/lib/plan-limits';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

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

    const lockCheck = await checkOrgLocked(orgId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: 'إرسال نماذج التقييم ميزة مدفوعة — يرجى الاشتراك أو التجديد للمتابعة.' }, { status: 403 });
    }

    const docRef = adminDb.collection('assessments').doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists || snap.data()?.organizationId !== orgId)
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const body = await req.json();
    const beneficiaryIds: string[] = body.beneficiaryIds || [];
    const coachIds: string[]       = body.coachIds || [];
    const mentorIds: string[]      = body.mentorIds || [];

    const totalCount = beneficiaryIds.length + coachIds.length + mentorIds.length;
    if (totalCount === 0)
      return NextResponse.json({ error: 'لم يتم تحديد أي مستلم' }, { status: 400 });

    const assessmentData = snap.data()!;

    const existingSentTo: string[]        = assessmentData.sentTo || [];
    const existingSentToCoaches: string[] = assessmentData.sentToCoaches || [];
    const existingSentToMentors: string[] = assessmentData.sentToMentors || [];

    const newBenef   = beneficiaryIds.filter(id => !existingSentTo.includes(id));
    const newCoaches = coachIds.filter(id => !existingSentToCoaches.includes(id));
    const newMentors = mentorIds.filter(id => !existingSentToMentors.includes(id));

    const totalNew = newBenef.length + newCoaches.length + newMentors.length;

    const updatePayload: Record<string, any> = { status: 'active' };
    if (newBenef.length)   updatePayload.sentTo         = FieldValue.arrayUnion(...newBenef);
    if (newCoaches.length) updatePayload.sentToCoaches  = FieldValue.arrayUnion(...newCoaches);
    if (newMentors.length) updatePayload.sentToMentors  = FieldValue.arrayUnion(...newMentors);
    await docRef.update(updatePayload);

    const benefBody = `لديك نموذج تقييم "${assessmentData.title}" من ${assessmentData.orgName || 'المنظمة'}`;
    const staffBody = `طُلب منك ملء نموذج تقييم "${assessmentData.title}" من ${assessmentData.orgName || 'المنظمة'}`;

    await Promise.all([
      ...newBenef.map(uid => notifyUser({
        uid, type: 'assessment', title: 'نموذج تقييم جديد', body: benefBody,
        link: '/beneficiary-dashboard/assessments',
        email: { subject: 'نموذج تقييم جديد', bodyHtml: benefBody, ctaText: 'عرض النموذج', ctaLink: `${SITE_URL}/beneficiary-dashboard/assessments` },
      })),
      ...newCoaches.map(uid => notifyUser({
        uid, type: 'assessment', title: 'نموذج تقييم جديد', body: staffBody,
        link: '/coach-dashboard/assessments',
        email: { subject: 'نموذج تقييم جديد', bodyHtml: staffBody, ctaText: 'عرض النموذج', ctaLink: `${SITE_URL}/coach-dashboard/assessments` },
      })),
      ...newMentors.map(uid => notifyUser({
        uid, type: 'assessment', title: 'نموذج تقييم جديد', body: staffBody,
        link: '/mentor-dashboard/assessments',
        email: { subject: 'نموذج تقييم جديد', bodyHtml: staffBody, ctaText: 'عرض النموذج', ctaLink: `${SITE_URL}/mentor-dashboard/assessments` },
      })),
    ]);

    return NextResponse.json({ success: true, sent: totalNew });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
