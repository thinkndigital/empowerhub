import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snap = await adminDb.collection('sessions')
      .where('isPublic', '==', true)
      .where('status', '==', 'scheduled')
      .get();

    const now = new Date();

    const sessions = await Promise.all(
      snap.docs.map(async d => {
        const data = d.data();
        let date = data.date;
        if (date && typeof date === 'object' && (date._seconds || date.seconds)) {
          date = new Date((date._seconds ?? date.seconds) * 1000).toISOString();
        }
        if (new Date(date) < now) return null;

        let hostName = '';
        let hostAvatarUrl = '';
        if (data.hostId) {
          const hostDoc = await adminDb.collection('users').doc(data.hostId).get();
          const host = hostDoc.data();
          hostName = host?.name || host?.displayName || '';
          hostAvatarUrl = host?.avatarUrl || '';
        }

        return {
          id: d.id,
          title: data.title || '',
          description: data.description || '',
          date,
          duration: data.duration || 60,
          meetLink: data.meetLink || '',
          bannerUrl: data.bannerUrl || '',
          imageUrls: data.imageUrls || [],
          hostId: data.hostId || '',
          hostName,
          hostAvatarUrl,
          price: data.price ?? null,
        };
      })
    );

    return NextResponse.json({
      sessions: sessions
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
