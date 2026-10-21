import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [article] = await db.select().from(articles).where(eq(articles.id, params.id)).limit(1);
    if (!article) return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    if (article.status !== 'published') {
      return NextResponse.json({ error: 'المقال غير متاح' }, { status: 404 });
    }
    return NextResponse.json({ article });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
