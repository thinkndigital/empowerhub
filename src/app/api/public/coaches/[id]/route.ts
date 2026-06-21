import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const coachSnap = await adminDb.collection('users').doc(params.id).get();
    if (!coachSnap.exists) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    const data = coachSnap.data()!;
    if (data.role !== 'coach') return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    // Fetch this coach's published courses
    const [snap1, snap2] = await Promise.all([
      adminDb.collection('courses').where('createdBy', '==', params.id).where('status', '==', 'published').get(),
      adminDb.collection('courses').where('createdBy', '==', params.id).where('status', '==', 'منشورة').get(),
    ]);
    const seen = new Set<string>();
    const courses = [...snap1.docs, ...snap2.docs]
      .filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; })
      .map(d => {
        const cd = d.data();
        return {
          id: d.id,
          title: cd.title || '',
          description: cd.description || '',
          price: cd.price ?? null,
          coverImageUrl: cd.coverImageUrl || cd.imageUrl || '',
          duration: cd.duration || '',
          enrollmentCount: cd.enrollmentCount || 0,
        };
      });

    return NextResponse.json({
      coach: {
        id: coachSnap.id,
        name: data.name || data.displayName || '',
        bio: data.bio || data.description || '',
        specializations: data.specializations || [],
        avatarUrl: data.avatarUrl || '',
        sessionPrice: data.sessionPrice ?? null,
        whatsapp: data.whatsapp || '',
        linkedin: data.linkedin || '',
        instagram: data.instagram || '',
        email: data.email || '',
        courses,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
