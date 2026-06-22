import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

function normalizeDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  return s ? new Date(s * 1000).toISOString() : null;
}

// GET all content: projects, articles, live_sessions, courses
export async function GET(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type') || 'all';

  const pick = (d: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      publishedAt: normalizeDate(data.publishedAt),
      createdAt: normalizeDate(data.createdAt),
      date: normalizeDate(data.date),
    };
  };

  if (type === 'projects') {
    const snap = await adminDb.collection('projects').get();
    return NextResponse.json({ items: snap.docs.map(pick) });
  }
  if (type === 'articles') {
    const snap = await adminDb.collection('articles').get();
    return NextResponse.json({ items: snap.docs.map(pick) });
  }
  if (type === 'live_sessions') {
    const snap = await adminDb.collection('live_sessions').get();
    return NextResponse.json({ items: snap.docs.map(pick) });
  }
  if (type === 'courses') {
    const snap = await adminDb.collection('courses').get();
    return NextResponse.json({ items: snap.docs.map(pick) });
  }

  // all — parallel fetch
  const [projectsSnap, articlesSnap, sessionsSnap, coursesSnap] = await Promise.all([
    adminDb.collection('projects').get(),
    adminDb.collection('articles').get(),
    adminDb.collection('live_sessions').get(),
    adminDb.collection('courses').get(),
  ]);

  return NextResponse.json({
    projects: projectsSnap.docs.map(pick),
    articles: articlesSnap.docs.map(pick),
    live_sessions: sessionsSnap.docs.map(pick),
    courses: coursesSnap.docs.map(pick),
  });
}

// PATCH — publish / unpublish / update status
export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { collection: col, id, status } = await req.json();
  if (!col || !id || !status) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  const updates: Record<string, any> = { status };
  if (status === 'published') {
    updates.publishedAt = FieldValue.serverTimestamp();
  }

  await adminDb.collection(col).doc(id).update(updates);
  return NextResponse.json({ ok: true });
}

// POST — create project/article/live_session directly as admin
export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { collection: col, ...data } = body;
  if (!col) return NextResponse.json({ error: 'collection required' }, { status: 400 });

  const docData = {
    ...data,
    status: data.status || 'published',
    createdAt: FieldValue.serverTimestamp(),
    publishedAt: (data.status || 'published') === 'published' ? FieldValue.serverTimestamp() : null,
  };

  const ref = await adminDb.collection(col).add(docData);
  return NextResponse.json({ ok: true, id: ref.id });
}

// DELETE
export async function DELETE(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { collection: col, id } = await req.json();
  if (!col || !id) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  await adminDb.collection(col).doc(id).delete();
  return NextResponse.json({ ok: true });
}
