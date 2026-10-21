import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
    if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    if (project.status !== 'published') {
      return NextResponse.json({ error: 'المشروع غير متاح' }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
