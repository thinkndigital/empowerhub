import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { projects, articles, liveSessions, courses } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

const TABLES = {
  projects,
  articles,
  live_sessions: liveSessions,
  courses,
} as const;

type CollectionName = keyof typeof TABLES;

// Only projects and articles track a separate publishedAt timestamp.
const SUPPORTS_PUBLISHED_AT: Partial<Record<CollectionName, boolean>> = {
  projects: true,
  articles: true,
};

const INSERTABLE_FIELDS: Record<CollectionName, string[]> = {
  projects: ['title', 'description', 'coverImageUrl', 'organizationId', 'organizationName', 'type', 'location', 'deadline', 'status', 'registrationForm'],
  articles: ['title', 'excerpt', 'content', 'coverImageUrl', 'authorId', 'authorRole', 'authorName', 'authorAvatarUrl', 'organizationId', 'tags', 'readTime', 'status'],
  live_sessions: ['coachId', 'coachName', 'organizationId', 'title', 'description', 'coverImageUrl', 'date', 'duration', 'meetLink', 'price', 'maxParticipants', 'status'],
  courses: ['title', 'description', 'category', 'level', 'language', 'price', 'duration', 'status', 'coverImageUrl', 'coachName', 'createdBy', 'organizationId', 'objectives', 'requirements', 'tags'],
};

function isCollectionName(v: string): v is CollectionName {
  return v in TABLES;
}

// GET all content: projects, articles, live_sessions, courses
export async function GET(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type') || 'all';

  if (type !== 'all') {
    if (!isCollectionName(type)) return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 });
    const items = await db.select().from(TABLES[type]);
    return NextResponse.json({ items });
  }

  const [projectRows, articleRows, sessionRows, courseRows] = await Promise.all([
    db.select().from(projects),
    db.select().from(articles),
    db.select().from(liveSessions),
    db.select().from(courses),
  ]);

  return NextResponse.json({
    projects: projectRows,
    articles: articleRows,
    live_sessions: sessionRows,
    courses: courseRows,
  });
}

// PATCH — publish / unpublish / update status
export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { collection: col, id, status } = await req.json();
  if (!col || !id || !status || !isCollectionName(col)) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const updates: Record<string, any> = { status };
  if (status === 'published' && SUPPORTS_PUBLISHED_AT[col]) {
    updates.publishedAt = new Date();
  }

  await db.update(TABLES[col]).set(updates as any).where(eq((TABLES[col] as any).id, id));
  return NextResponse.json({ ok: true });
}

// POST — create project/article/live_session/course directly as admin
export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { collection: col, ...data } = body;
  if (!col || !isCollectionName(col)) return NextResponse.json({ error: 'collection required' }, { status: 400 });

  const id = randomUUID();
  const status = data.status || 'published';
  const values: Record<string, any> = { id, status };
  for (const field of INSERTABLE_FIELDS[col]) {
    if (data[field] !== undefined) values[field] = field === 'date' ? new Date(data[field]) : data[field];
  }
  if (SUPPORTS_PUBLISHED_AT[col]) {
    values.publishedAt = status === 'published' ? new Date() : null;
  }

  await db.insert(TABLES[col]).values(values as any);
  return NextResponse.json({ ok: true, id });
}

// DELETE
export async function DELETE(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { collection: col, id } = await req.json();
  if (!col || !id || !isCollectionName(col)) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  await db.delete(TABLES[col]).where(eq((TABLES[col] as any).id, id));
  return NextResponse.json({ ok: true });
}
