import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

async function verifyOrgOwner(token: string, projectId: string) {
  const decoded = await adminAuth.verifyIdToken(token);
  const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
  const userData = userDoc.data() || {};
  if (userData.role !== 'organization') throw new Error('غير مصرح');

  const orgId = userData.organizationId || (decoded as any).organizationId || '';
  const projDoc = await adminDb.collection('projects').doc(projectId).get();
  if (!projDoc.exists) throw new Error('المشروع غير موجود');
  if (projDoc.data()?.organizationId !== orgId) throw new Error('غير مصرح');
  return { decoded, projDoc, orgId };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const { projDoc } = await verifyOrgOwner(token, params.id);
    const data = projDoc.data()!;
    const regsSnap = await adminDb.collection('projects').doc(params.id).collection('registrations').get();
    return NextResponse.json({
      project: {
        id: projDoc.id,
        ...data,
        publishedAt: normalizeDate(data.publishedAt),
        createdAt: normalizeDate(data.createdAt),
        registrationsCount: regsSnap.size,
      }
    });
  } catch (e: any) {
    const status = e.message === 'غير مصرح' ? 403 : e.message === 'المشروع غير موجود' ? 404 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const { projDoc } = await verifyOrgOwner(token, params.id);
    const existing = projDoc.data()!;
    const body = await req.json();

    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    const allowedFields = ['title', 'description', 'coverImageUrl', 'type', 'location', 'deadline', 'status', 'registrationForm'];
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (body.status === 'published' && existing.status !== 'published') {
      updates.publishedAt = FieldValue.serverTimestamp();
    }

    await adminDb.collection('projects').doc(params.id).update(updates);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e.message === 'غير مصرح' ? 403 : e.message === 'المشروع غير موجود' ? 404 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOrgOwner(token, params.id);
    await adminDb.collection('projects').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e.message === 'غير مصرح' ? 403 : e.message === 'المشروع غير موجود' ? 404 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
