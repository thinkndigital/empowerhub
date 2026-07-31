import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  if (d._seconds || d.seconds) return new Date((d._seconds ?? d.seconds) * 1000).toISOString();
  return null;
}

async function resolveOrgId(decoded: any): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  return snap.data()?.organizationId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const snap = await adminDb.collection('successStories').where('orgId', '==', orgId).get();
    const stories = snap.docs
      .map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          beneficiaryName: d.beneficiaryName || '',
          beneficiaryRole: d.beneficiaryRole || '',
          title: d.title || '',
          content: d.content || '',
          avatarUrl: d.avatarUrl || '',
          stars: d.stars ?? 5,
          status: d.status || 'draft',
          orgName: d.orgName || '',
          createdAt: normalizeDate(d.createdAt),
        };
      })
      .sort((a, b) => (b.createdAt ?? '') > (a.createdAt ?? '') ? 1 : -1);

    return NextResponse.json({ stories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const orgDoc = await adminDb.collection('organizations').doc(orgId).get();
    const orgName = orgDoc.data()?.name || '';

    const body = await req.json();
    const { beneficiaryName, beneficiaryRole, title, content, avatarUrl, stars, status } = body;
    if (!beneficiaryName?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'الاسم ونص القصة مطلوبان' }, { status: 400 });
    }

    const ref = await adminDb.collection('successStories').add({
      orgId,
      orgName,
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryRole: (beneficiaryRole || '').trim(),
      title: (title || '').trim(),
      content: content.trim(),
      avatarUrl: avatarUrl || '',
      stars: Math.min(5, Math.max(1, Number(stars) || 5)),
      status: status === 'published' ? 'published' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
