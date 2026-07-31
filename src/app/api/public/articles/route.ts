import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get('role');
    let query = adminDb.collection('articles').where('status', '==', 'published') as FirebaseFirestore.Query;
    if (role === 'mentor' || role === 'coach') {
      query = query.where('authorRole', '==', role);
    }
    const snap = await query.get();
    const articles = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        excerpt: data.excerpt,
        coverImageUrl: data.coverImageUrl,
        authorName: data.authorName,
        authorAvatarUrl: data.authorAvatarUrl,
        authorRole: data.authorRole,
        publishedAt: normalizeDate(data.publishedAt),
        tags: data.tags || [],
        readTime: data.readTime,
      };
    });
    articles.sort((a: any, b: any) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    return NextResponse.json({ articles });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
