import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function pick(u: typeof users.$inferSelect) {
  return {
    id: u.id, name: u.name, displayName: u.displayName,
    bio: u.bio, specializations: u.specializations || [],
    avatarUrl: u.avatarUrl || '',
    sessionPrice: u.sessionPrice ?? null,
    whatsapp: u.whatsapp || '', linkedin: u.linkedin || '',
    instagram: u.instagram || '', email: u.email || '',
    website: u.website || '', twitter: u.twitter || '',
    yearsOfExperience: u.yearsOfExperience ?? null,
    certifications: u.certifications || '',
  };
}

export async function GET() {
  try {
    const [mentorRows, coachRows] = await Promise.all([
      db.select().from(users).where(eq(users.role, 'mentor')).limit(50),
      db.select().from(users).where(eq(users.role, 'coach')).limit(50),
    ]);
    return NextResponse.json({
      mentors: mentorRows.map(pick),
      coaches: coachRows.map(pick),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
