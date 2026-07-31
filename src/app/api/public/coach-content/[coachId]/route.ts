import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(_req: Request, { params }: { params: { coachId: string } }) {
  try {
    const { coachId } = params;

    const [coursesSnap, liveSnap] = await Promise.all([
      adminDb.collection('courses').where('createdBy', '==', coachId).where('status', 'in', ['published', 'منشورة']).get(),
      adminDb.collection('live_sessions').where('coachId', '==', coachId).where('status', '==', 'published').get(),
    ]);

    const courses = coursesSnap.docs.map(d => ({ id: d.id, title: d.data().title || '', type: 'course' as const }));
    const liveSessions = liveSnap.docs.map(d => ({ id: d.id, title: d.data().title || '', type: 'live_session' as const }));

    return NextResponse.json({ courses, liveSessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
