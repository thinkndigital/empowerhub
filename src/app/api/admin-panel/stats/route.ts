import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { organizations, users, courses, products } from '@/lib/schema';
import { sql, eq } from 'drizzle-orm';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [[{ c: orgCount }], [{ c: userCount }], [{ c: mentorCount }], [{ c: coachCount }], [{ c: courseCount }], [{ c: productCount }]] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(organizations),
    db.select({ c: sql<number>`count(*)` }).from(users),
    db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.role, 'mentor')),
    db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.role, 'coach')),
    db.select({ c: sql<number>`count(*)` }).from(courses),
    db.select({ c: sql<number>`count(*)` }).from(products),
  ]);

  return NextResponse.json({
    orgs: Number(orgCount),
    users: Number(userCount),
    mentors: Number(mentorCount),
    coaches: Number(coachCount),
    courses: Number(courseCount),
    products: Number(productCount),
  });
}
