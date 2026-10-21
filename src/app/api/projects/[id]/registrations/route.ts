import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { projects, projectRegistrations, users } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'organization') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const orgId = userRow?.organizationId || decoded.organizationId || '';
    const [project] = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
    if (!project || project.organizationId !== orgId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const registrations = await db.select().from(projectRegistrations)
      .where(eq(projectRegistrations.projectId, params.id))
      .orderBy(desc(projectRegistrations.submittedAt));
    return NextResponse.json({ registrations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
