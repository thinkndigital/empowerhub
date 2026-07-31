import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(_req: NextRequest) {
  try {
    const snap = await adminDb.collection('projects').where('status', '==', 'published').get();
    const projects = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        type: data.type,
        location: data.location,
        deadline: data.deadline,
        publishedAt: normalizeDate(data.publishedAt),
      };
    });
    projects.sort((a: any, b: any) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    return NextResponse.json({ projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
