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

    // sentTo/sentToCoaches/sentToMentors track who has access to the form
    // (used to filter the recipient-side listing) — arrayUnion keeps that
    // idempotent regardless of who was already on the list. But every
    // explicit "Send" click is a deliberate action by the org (often used
    // to remind people who haven't responded yet), so it must notify
    // *everyone currently selected*, not just recipients who weren't
    // already tracked — silently skipping already-tracked people here used
    // to make re-sends appear to do nothing.
    const updatePayload: Record<string, any> = { status: 'active' };
    if (beneficiaryIds.length) updatePayload.sentTo        = FieldValue.arrayUnion(...beneficiaryIds);
    if (coachIds.length)       updatePayload.sentToCoaches = FieldValue.arrayUnion(...coachIds);
    if (mentorIds.length)      updatePayload.sentToMentors = FieldValue.arrayUnion(...mentorIds);
    await docRef.update(updatePayload);

    const benefBody = `لديك نموذج تقييم "${assessmentData.title}" من ${assessmentData.orgName || 'المنظمة'}`;
    const staffBody = `طُلب منك ملء نموذج تقييم "${assessmentData.title}" من ${assessmentData.orgName || 'المنظمة'}`;

    await Promise.all([
      ...beneficiaryIds.map(uid => notifyUser({
        uid, type: 'assessment', title: 'نموذج تقييم جديد', body: benefBody,
        link: '/beneficiary-dashboard/assessments',
        email: { subject: 'نموذج تقييم جديد', bodyHtml: benefBody, ctaText: 'عرض النموذج', ctaLink: `${SITE_URL}/beneficiary-dashboard/assessments` },
      })),
      ...coachIds.map(uid => notifyUser({
        uid, type: 'assessment', title: 'نموذج تقييم جديد', body: staffBody,
        link: '/coach-dashboard/assessments',
        email: { subject: 'نموذج تقييم جديد', bodyHtml: staffBody, ctaText: 'عرض النموذج', ctaLink: `${SITE_URL}/coach-dashboard/assessments` },
      })),
      ...mentorIds.map(uid => notifyUser({
        uid, type: 'assessment', title: 'نموذج تقييم جديد', body: staffBody,
        link: '/mentor-dashboard/assessments',
        email: { subject: 'نموذج تقييم جديد', bodyHtml: staffBody, ctaText: 'عرض النموذج', ctaLink: `${SITE_URL}/mentor-dashboard/assessments` },
      })),
    ]);

    return NextResponse.json({ success: true, sent: totalCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
