import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, role, bio, specializations, sessionPrice, avatarUrl, whatsapp, linkedin, instagram, email, yearsOfExperience } = body;

  if (!name || !role || !['mentor', 'coach'].includes(role)) {
    return NextResponse.json({ error: 'الاسم والدور مطلوبان' }, { status: 400 });
  }

  const docRef = adminDb.collection('users').doc();
  await docRef.set({
    name,
    role,
    bio: bio || '',
    specializations: Array.isArray(specializations) ? specializations : (specializations ? [specializations] : []),
    sessionPrice: sessionPrice ? Number(sessionPrice) : null,
    avatarUrl: avatarUrl || '',
    whatsapp: whatsapp || '',
    linkedin: linkedin || '',
    instagram: instagram || '',
    email: email || '',
    yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
    status: 'active',
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  await adminDb.collection('users').doc(id).delete();
  return NextResponse.json({ ok: true });
}
