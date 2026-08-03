import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { checkOrgLocked } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

async function getOrgId(decoded: any): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  return snap.data()?.organizationId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const snap = await adminDb.collection('assessments').where('organizationId', '==', orgId).get();
    const assessments = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, ...data,
        createdAt: data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : null,
      };
    }).sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return NextResponse.json({ assessments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const lockCheck = await checkOrgLocked(orgId);
    if (!lockCheck.allowed) {
      return NextResponse.json({ error: 'إنشاء نماذج التقييم ميزة مدفوعة — يرجى الاشتراك أو التجديد للمتابعة.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, type, questions, status } = body;
    if (!title || !type) return NextResponse.json({ error: 'العنوان ونوع التقييم مطلوبان' }, { status: 400 });

    const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
    const orgData = orgSnap.data() || {};

    const ref = await adminDb.collection('assessments').add({
      title, description: description || '', type,
      questions: questions || [],
      status: status || 'draft',
      organizationId: orgId,
      createdBy: decoded.uid,
      sentTo: [],
      responsesCount: 0,
      orgName: orgData.name || '',
      orgLogo: orgData.logoUrl || '',
      orgColor: orgData.primaryColor || '',
      createdAt: new Date(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
