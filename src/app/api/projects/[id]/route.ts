import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { projects, projectRegistrations, users } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

async function verifyOrgOwner(token: string, projectId: string) {
  const decoded = await verifyAuthToken(token);
  const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
  if (userRow?.role !== 'organization') throw new Error('غير مصرح');

  const orgId = userRow?.organizationId || decoded.organizationId || '';
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error('المشروع غير موجود');
  if (project.organizationId !== orgId) throw new Error('غير مصرح');
  return { decoded, project, orgId };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const { project } = await verifyOrgOwner(token, params.id);
    const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(projectRegistrations).where(eq(projectRegistrations.projectId, params.id));
    return NextResponse.json({ project: { ...project, registrationsCount: Number(c) } });
  } catch (e: any) {
    const status = e.message === 'غير مصرح' ? 403 : e.message === 'المشروع غير موجود' ? 404 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const { project } = await verifyOrgOwner(token, params.id);
    const body = await req.json();

    const updates: Record<string, any> = { updatedAt: new Date() };
    const allowedFields = ['title', 'description', 'coverImageUrl', 'type', 'location', 'deadline', 'status', 'registrationForm'] as const;
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (body.status === 'published' && project.status !== 'published') {
      updates.publishedAt = new Date();
    }

    await db.update(projects).set(updates).where(eq(projects.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e.message === 'غير مصرح' ? 403 : e.message === 'المشروع غير موجود' ? 404 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await verifyOrgOwner(token, params.id);
    await db.delete(projects).where(eq(projects.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e.message === 'غير مصرح' ? 403 : e.message === 'المشروع غير موجود' ? 404 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
