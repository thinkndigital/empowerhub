import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const snap = await adminDb.collection('courses').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    const data = snap.data()!;

    const allowed = ['published', 'منشورة'];
    if (!allowed.includes(data.status)) return NextResponse.json({ error: 'غير متاح' }, { status: 404 });

    let coachName = data.coachName || '';
    let coachAvatarUrl = '';
    if (data.createdBy) {
      const coachSnap = await adminDb.collection('users').doc(data.createdBy).get();
      if (coachSnap.exists) {
        coachName = coachName || coachSnap.data()!.name || coachSnap.data()!.displayName || '';
        coachAvatarUrl = coachSnap.data()!.avatarUrl || '';
      }
    }

    return NextResponse.json({
      course: {
        id: snap.id,
        title: data.title || '',
        description: data.description || '',
        price: data.price ?? null,
        coverImageUrl: data.coverImageUrl || data.imageUrl || '',
        duration: data.duration || '',
        createdBy: data.createdBy || '',
        coachName,
        coachAvatarUrl,
        enrollmentCount: data.enrollmentCount || 0,
        objectives: data.objectives || [],
        requirements: data.requirements || [],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
