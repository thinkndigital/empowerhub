import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth-server';
import { randomUUID } from 'crypto';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select().from(users).where(inArray(users.role, ['mentor', 'coach']));

  const pick = (u: typeof users.$inferSelect) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, organizationId: u.organizationId,
    status: u.status, specializations: u.specializations, avatarUrl: u.avatarUrl,
  });

  return NextResponse.json({
    mentors: rows.filter(u => u.role === 'mentor').map(pick),
    coaches: rows.filter(u => u.role === 'coach').map(pick),
  });
}

export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, role, bio, specializations, sessionPrice, avatarUrl, whatsapp, linkedin, instagram, email, yearsOfExperience } = body;

  if (!name || !role || !['mentor', 'coach'].includes(role)) {
    return NextResponse.json({ error: 'الاسم والدور مطلوبان' }, { status: 400 });
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(randomUUID());
  await db.insert(users).values({
    id,
    name,
    email: email || `${id}@placeholder.empowerhub.local`,
    passwordHash,
    role,
    bio: bio || '',
    specializations: Array.isArray(specializations) ? specializations : (specializations ? [specializations] : []),
    sessionPrice: sessionPrice ? String(Number(sessionPrice)) : null,
    avatarUrl: avatarUrl || '',
    whatsapp: whatsapp || '',
    linkedin: linkedin || '',
    instagram: instagram || '',
    yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
    status: 'active',
  });

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
