import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  if (d._seconds || d.seconds) return new Date((d._seconds ?? d.seconds) * 1000).toISOString();
  return null;
}

export async function GET() {
  try {
    const snap = await adminDb.collection('successStories').where('status', '==', 'published').get();
    const stories = snap.docs
      .map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          beneficiaryName: d.beneficiaryName || '',
          beneficiaryRole: d.beneficiaryRole || '',
          title: d.title || '',
          content: d.content || '',
          avatarUrl: d.avatarUrl || '',
          stars: d.stars ?? 5,
          orgName: d.orgName || '',
          createdAt: normalizeDate(d.createdAt),
        };
      })
      .sort((a, b) => (b.createdAt ?? '') > (a.createdAt ?? '') ? 1 : -1);
    return NextResponse.json({ stories });
  } catch {
    return NextResponse.json({ stories: [] });
  }
}
