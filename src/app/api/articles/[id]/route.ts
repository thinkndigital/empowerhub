import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { articles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const [article] = await db.select().from(articles).where(eq(articles.id, params.id)).limit(1);
    if (!article) return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    if (article.authorId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    return NextResponse.json({ article });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const [existing] = await db.select().from(articles).where(eq(articles.id, params.id)).limit(1);
    if (!existing) return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    if (existing.authorId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};

    const allowedFields = ['title', 'excerpt', 'content', 'coverImageUrl', 'tags', 'status'] as const;
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (body.tags && typeof body.tags === 'string') {
      updates.tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    if (body.content) {
      updates.readTime = String(Math.max(1, Math.ceil(body.content.split(/\s+/).length / 200)));
    }

    if (body.status === 'published' && existing.status !== 'published') {
      updates.publishedAt = new Date();
    }

    await db.update(articles).set(updates).where(eq(articles.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const [article] = await db.select().from(articles).where(eq(articles.id, params.id)).limit(1);
    if (!article) return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    if (article.authorId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    await db.delete(articles).where(eq(articles.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
