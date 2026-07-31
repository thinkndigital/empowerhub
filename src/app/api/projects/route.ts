import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    if (userData.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const orgId = userData.organizationId || (decoded as any).organizationId || '';
    if (!orgId) return NextResponse.json({ error: 'لا يوجد معرف المنظمة' }, { status: 400 });

    const snap = await adminDb.collection('projects').where('organizationId', '==', orgId).get();

    // Count registrations for each project
    const projects = await Promise.all(snap.docs.map(async d => {
      const data = d.data();
      const regsSnap = await adminDb.collection('projects').doc(d.id).collection('registrations').get();
      return {
        id: d.id,
        ...data,
        publishedAt: normalizeDate(data.publishedAt),
        createdAt: normalizeDate(data.createdAt),
        registrationsCount: regsSnap.size,
      };
    }));
    projects.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return NextResponse.json({ projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    if (userData.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const orgId = userData.organizationId || (decoded as any).organizationId || '';
    if (!orgId) return NextResponse.json({ error: 'لا يوجد معرف المنظمة' }, { status: 400 });

    const orgDoc = await adminDb.doc(`organizations/${orgId}`).get();
    const orgName = orgDoc.data()?.name || userData.name || '';

    const body = await req.json();
    const {
      title, description, coverImageUrl = '', type = 'أخرى',
      location = '', deadline = '', status = 'draft',
      registrationForm = { fields: {} },
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'العنوان والوصف مطلوبان' }, { status: 400 });
    }

    const docRef = await adminDb.collection('projects').add({
      title,
      description,
      coverImageUrl,
      organizationId: orgId,
      organizationName: orgName,
      type,
      location,
      deadline,
      status,
      registrationForm,
      publishedAt: status === 'published' ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
