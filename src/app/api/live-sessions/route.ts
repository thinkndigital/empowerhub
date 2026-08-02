import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkOrgLocked } from '@/lib/plan-limits';

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
    if (userData.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const snap = await adminDb.collection('live_sessions').where('coachId', '==', decoded.uid).get();

    const sessions = await Promise.all(snap.docs.map(async d => {
      const data = d.data();
      const regsSnap = await adminDb.collection('live_sessions').doc(d.id).collection('registrations').get();
      return {
        id: d.id,
        ...data,
        date: normalizeDate(data.date),
        createdAt: normalizeDate(data.createdAt),
        registrationsCount: regsSnap.size,
      };
    }));
    sessions.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return NextResponse.json({ sessions });
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
    if (userData.role !== 'coach') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, description = '', coverImageUrl = '',
      date, duration = 60, meetLink = '',
      price = 0, maxParticipants = null, status = 'draft',
    } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'العنوان والتاريخ مطلوبان' }, { status: 400 });
    }

    const orgId = userData.organizationId || (decoded as any).organizationId || '';

    if (orgId) {
      const lockCheck = await checkOrgLocked(orgId);
      if (!lockCheck.allowed) {
        return NextResponse.json({ error: lockCheck.message }, { status: 403 });
      }
    }

    const docRef = await adminDb.collection('live_sessions').add({
      coachId: decoded.uid,
      coachName: userData.name || '',
      organizationId: orgId,
      title,
      description,
      coverImageUrl,
      date: new Date(date),
      duration: Number(duration),
      meetLink,
      price: Number(price),
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      status,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
