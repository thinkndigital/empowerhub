import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [mentorsSnap, coachesSnap] = await Promise.all([
    adminDb.collection('users').where('role', '==', 'mentor').get(),
    adminDb.collection('users').where('role', '==', 'coach').get(),
  ]);

  const pick = (d: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = d.data();
    return { id: d.id, name: data.name, email: data.email, role: data.role, organizationId: data.organizationId, status: data.status, specializations: data.specializations, avatarUrl: data.avatarUrl };
  };

  return NextResponse.json({
    mentors: mentorsSnap.docs.map(pick),
    coaches: coachesSnap.docs.map(pick),
  });
}
