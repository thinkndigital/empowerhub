import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { articles, users } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const rows = await db.select().from(articles)
      .where(eq(articles.authorId, decoded.uid))
      .orderBy(desc(articles.createdAt));
    return NextResponse.json({ articles: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();
    const { title, excerpt, content, coverImageUrl = '', tags = [], status = 'draft' } = body;
    if (!title || !content) {
      return NextResponse.json({ error: 'العنوان والمحتوى مطلوبان' }, { status: 400 });
    }

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const authorRole = userRow?.role === 'coach' ? 'coach' : 'mentor';
    const readTime = String(Math.max(1, Math.ceil(content.split(/\s+/).length / 200)));
    const tagsArr = typeof tags === 'string'
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : (Array.isArray(tags) ? tags : []);

    const orgId = userRow?.organizationId || decoded.organizationId || null;

    const id = randomUUID();
    await db.insert(articles).values({
      id,
      title,
      excerpt: excerpt || '',
      content,
      coverImageUrl,
      authorId: decoded.uid,
      authorRole,
      authorName: userRow?.name || '',
      authorAvatarUrl: userRow?.avatarUrl || '',
      organizationId: orgId,
      tags: tagsArr,
      readTime,
      status,
      publishedAt: status === 'published' ? new Date() : null,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
