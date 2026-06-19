import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [orgsSnap, usersSnap, coursesSnap, productsSnap] = await Promise.all([
    adminDb.collection('organizations').get(),
    adminDb.collection('users').get(),
    adminDb.collection('courses').get(),
    adminDb.collection('products').get(),
  ]);

  let mentors = 0, coaches = 0;
  usersSnap.docs.forEach(d => {
    const r = d.data().role;
    if (r === 'mentor') mentors++;
    if (r === 'coach') coaches++;
  });

  return NextResponse.json({
    orgs: orgsSnap.size,
    users: usersSnap.size,
    mentors,
    coaches,
    courses: coursesSnap.size,
    products: productsSnap.size,
  });
}
