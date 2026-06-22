import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('articles')
      .where('authorId', '==', decoded.uid)
      .get();
    const articles = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      publishedAt: normalizeDate(d.data().publishedAt),
      createdAt: normalizeDate(d.data().createdAt),
      updatedAt: normalizeDate(d.data().updatedAt),
    }));
    articles.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return NextResponse.json({ articles });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const { title, excerpt, content, coverImageUrl = '', tags = [], status = 'draft' } = body;
    if (!title || !content) {
      return NextResponse.json({ error: 'العنوان والمحتوى مطلوبان' }, { status: 400 });
    }

    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userData = userDoc.data() || {};
    const authorRole = userData.role === 'coach' ? 'coach' : 'mentor';
    const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    const tagsArr = typeof tags === 'string'
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : (Array.isArray(tags) ? tags : []);

    const orgId = userData.organizationId || (decoded as any).organizationId || '';

    const docRef = await adminDb.collection('articles').add({
      title,
      excerpt: excerpt || '',
      content,
      coverImageUrl,
      authorId: decoded.uid,
      authorRole,
      authorName: userData.name || '',
      authorAvatarUrl: userData.avatarUrl || '',
      organizationId: orgId,
      tags: tagsArr,
      readTime,
      status,
      publishedAt: status === 'published' ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
