import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [mentor] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!mentor || mentor.role !== 'mentor') return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    return NextResponse.json({
      mentor: {
        id: mentor.id,
        name: mentor.name || mentor.displayName || '',
        bio: mentor.bio || '',
        specializations: mentor.specializations || [],
        avatarUrl: mentor.avatarUrl || '',
        sessionPrice: mentor.sessionPrice ?? null,
        whatsapp: mentor.whatsapp || '',
        linkedin: mentor.linkedin || '',
        instagram: mentor.instagram || '',
        email: mentor.email || '',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
