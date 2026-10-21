import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { successStories } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await db.select().from(successStories).where(eq(successStories.status, 'published')).orderBy(desc(successStories.createdAt));
    return NextResponse.json({
      stories: rows.map(s => ({
        id: s.id,
        beneficiaryName: s.beneficiaryName || '',
        beneficiaryRole: s.beneficiaryRole || '',
        title: s.title || '',
        content: s.content || '',
        avatarUrl: s.avatarUrl || '',
        stars: s.stars ?? 5,
        orgName: s.orgName || '',
        createdAt: s.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ stories: [] });
  }
}
