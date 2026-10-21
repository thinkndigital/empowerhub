import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const rows = await db.select().from(projects).where(eq(projects.status, 'published')).orderBy(desc(projects.publishedAt));
    return NextResponse.json({
      projects: rows.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        coverImageUrl: p.coverImageUrl,
        organizationId: p.organizationId,
        organizationName: p.organizationName,
        type: p.type,
        location: p.location,
        deadline: p.deadline,
        publishedAt: p.publishedAt,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
