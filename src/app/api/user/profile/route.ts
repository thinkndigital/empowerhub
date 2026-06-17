import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('users').doc(decoded.uid).get();
    if (!snap.exists) return NextResponse.json({ profile: null });

    const data = snap.data()!;
    const profile: Record<string, unknown> = { id: snap.id, ...data };

    // Enrich with mentor name
    if (data.mentorId) {
      try {
        const mentorSnap = await adminDb.collection('users').doc(data.mentorId).get();
        if (mentorSnap.exists) profile.mentorName = (mentorSnap.data() as any)?.name || null;
      } catch { /* ignore */ }
    }

    // Enrich with coach name
    if (data.coachId) {
      try {
        const coachSnap = await adminDb.collection('users').doc(data.coachId).get();
        if (coachSnap.exists) profile.coachName = (coachSnap.data() as any)?.name || null;
      } catch { /* ignore */ }
    }

    return NextResponse.json({ profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    await adminDb.collection('users').doc(decoded.uid).set(body, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
