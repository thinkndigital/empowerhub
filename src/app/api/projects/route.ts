import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { projects, projectRegistrations, users, organizations } from '@/lib/schema';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const orgId = userRow?.organizationId || decoded.organizationId || '';
    if (!orgId) return NextResponse.json({ error: 'لا يوجد معرف المنظمة' }, { status: 400 });

    const projectRows = await db.select().from(projects).where(eq(projects.organizationId, orgId)).orderBy(desc(projects.createdAt));

    const projectIds = projectRows.map(p => p.id);
    const counts = projectIds.length
      ? await db.select({ projectId: projectRegistrations.projectId, c: sql<number>`count(*)` })
          .from(projectRegistrations).where(inArray(projectRegistrations.projectId, projectIds)).groupBy(projectRegistrations.projectId)
      : [];
    const countMap = new Map(counts.map(c => [c.projectId, Number(c.c)]));

    const result = projectRows.map(p => ({ ...p, registrationsCount: countMap.get(p.id) || 0 }));
    return NextResponse.json({ projects: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const orgId = userRow?.organizationId || decoded.organizationId || '';
    if (!orgId) return NextResponse.json({ error: 'لا يوجد معرف المنظمة' }, { status: 400 });

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const orgName = org?.name || userRow?.name || '';

    const body = await req.json();
    const {
      title, description, coverImageUrl = '', type = 'أخرى',
      location = '', deadline = '', status = 'draft',
      registrationForm = { fields: {} },
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'العنوان والوصف مطلوبان' }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(projects).values({
      id,
      title,
      description,
      coverImageUrl,
      organizationId: orgId,
      organizationName: orgName,
      type,
      location,
      deadline,
      status,
      registrationForm,
      publishedAt: status === 'published' ? new Date() : null,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
