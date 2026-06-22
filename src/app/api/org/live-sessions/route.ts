import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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
    const orgId = userData.organizationId || (decoded as any).organizationId || '';
    if (!orgId || userData.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get all coaches in this org
    const coachesSnap = await adminDb.collection('users')
      .where('organizationId', '==', orgId)
      .where('role', '==', 'coach').get();
    const coachIds = coachesSnap.docs.map(d => d.id);

    if (coachIds.length === 0) return NextResponse.json({ sessions: [] });

    // Fetch live sessions for each coach and merge
    const snapshots = await Promise.all(
      coachIds.map(id => adminDb.collection('live_sessions').where('coachId', '==', id).get())
    );

    const seen = new Set<string>();
    const sessions = await Promise.all(
      snapshots.flatMap(snap => snap.docs).filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      }).map(async d => {
        const data = d.data();
        const regsSnap = await adminDb.collection('live_sessions').doc(d.id).collection('registrations').get();
        return {
          id: d.id,
          title: data.title,
          coachName: data.coachName,
          date: normalizeDate(data.date),
          duration: data.duration,
          price: data.price,
          maxParticipants: data.maxParticipants,
          status: data.status,
          coverImageUrl: data.coverImageUrl,
          registrationsCount: regsSnap.size,
        };
      })
    );
    sessions.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
