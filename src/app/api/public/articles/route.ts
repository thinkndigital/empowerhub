import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get('role');
    const conditions = [eq(articles.status, 'published')];
    if (role === 'mentor' || role === 'coach') {
      conditions.push(eq(articles.authorRole, role));
    }

    const rows = await db.select().from(articles).where(and(...conditions)).orderBy(desc(articles.publishedAt));

    return NextResponse.json({
      articles: rows.map(a => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt,
        coverImageUrl: a.coverImageUrl,
        authorName: a.authorName,
        authorAvatarUrl: a.authorAvatarUrl,
        authorRole: a.authorRole,
        publishedAt: a.publishedAt,
        tags: a.tags || [],
        readTime: a.readTime,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
