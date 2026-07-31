import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

async function resolveOrgId(decoded: any): Promise<string | null> {
  if (decoded.organizationId) return decoded.organizationId;
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  return snap.data()?.organizationId || null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const ref = adminDb.collection('successStories').doc(params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.orgId !== orgId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (body.beneficiaryName !== undefined) updates.beneficiaryName = body.beneficiaryName.trim();
    if (body.beneficiaryRole !== undefined) updates.beneficiaryRole = body.beneficiaryRole.trim();
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.content !== undefined) updates.content = body.content.trim();
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
    if (body.stars !== undefined) updates.stars = Math.min(5, Math.max(1, Number(body.stars) || 5));
    if (body.status !== undefined) updates.status = body.status === 'published' ? 'published' : 'draft';

    await ref.update(updates);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await resolveOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const ref = adminDb.collection('successStories').doc(params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.orgId !== orgId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }

    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
