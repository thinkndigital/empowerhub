import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const doc = await adminDb.collection('articles').doc(params.id).get();
    if (!doc.exists) return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    const data = doc.data()!;
    if (data.authorId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    return NextResponse.json({
      article: {
        id: doc.id,
        ...data,
        publishedAt: normalizeDate(data.publishedAt),
        createdAt: normalizeDate(data.createdAt),
        updatedAt: normalizeDate(data.updatedAt),
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const doc = await adminDb.collection('articles').doc(params.id).get();
    if (!doc.exists) return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    const existing = doc.data()!;
    if (existing.authorId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

    const allowedFields = ['title', 'excerpt', 'content', 'coverImageUrl', 'tags', 'status'];
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (body.tags && typeof body.tags === 'string') {
      updates.tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    if (body.content) {
      updates.readTime = Math.max(1, Math.ceil(body.content.split(/\s+/).length / 200));
    }

    if (body.status === 'published' && existing.status !== 'published') {
      updates.publishedAt = FieldValue.serverTimestamp();
    }

    await adminDb.collection('articles').doc(params.id).update(updates);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const doc = await adminDb.collection('articles').doc(params.id).get();
    if (!doc.exists) return NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });
    const data = doc.data()!;
    if (data.authorId !== decoded.uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    await adminDb.collection('articles').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
