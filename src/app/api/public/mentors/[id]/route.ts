import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const snap = await adminDb.collection('users').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    const data = snap.data()!;
    if (data.role !== 'mentor') return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    return NextResponse.json({
      mentor: {
        id: snap.id,
        name: data.name || data.displayName || '',
        bio: data.bio || data.description || '',
        specializations: data.specializations || [],
        avatarUrl: data.avatarUrl || '',
        sessionPrice: data.sessionPrice ?? null,
        whatsapp: data.whatsapp || '',
        linkedin: data.linkedin || '',
        instagram: data.instagram || '',
        email: data.email || '',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
