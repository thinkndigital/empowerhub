import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = adminDb.collection('live_sessions').doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    }
    const data = snap.data()!;
    if (data.status !== 'published') {
      return NextResponse.json({ error: 'غير متاح' }, { status: 404 });
    }
    const regsSnap = await docRef.collection('registrations').get();
    return NextResponse.json({
      session: {
        id: snap.id,
        title: data.title,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        coachName: data.coachName,
        date: normalizeDate(data.date),
        duration: data.duration,
        price: data.price,
        maxParticipants: data.maxParticipants,
        registrationsCount: regsSnap.size,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
