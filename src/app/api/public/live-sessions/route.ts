import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET() {
  try {
    const snap = await adminDb.collection('live_sessions').where('status', '==', 'published').get();

    const sessions = await Promise.all(snap.docs.map(async d => {
      const data = d.data();
      const regsSnap = await adminDb.collection('live_sessions').doc(d.id).collection('registrations').get();
      return {
        id: d.id,
        title: data.title,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        coachName: data.coachName,
        date: normalizeDate(data.date),
        duration: data.duration,
        price: data.price,
        maxParticipants: data.maxParticipants,
        registrationsCount: regsSnap.size,
        createdAt: normalizeDate(data.createdAt),
      };
    }));
    sessions.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
