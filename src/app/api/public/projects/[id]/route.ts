import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await adminDb.collection('projects').doc(params.id).get();
    if (!doc.exists) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    const data = doc.data()!;
    if (data.status !== 'published') {
      return NextResponse.json({ error: 'المشروع غير متاح' }, { status: 404 });
    }
    return NextResponse.json({
      project: {
        id: doc.id,
        ...data,
        publishedAt: normalizeDate(data.publishedAt),
        createdAt: normalizeDate(data.createdAt),
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
