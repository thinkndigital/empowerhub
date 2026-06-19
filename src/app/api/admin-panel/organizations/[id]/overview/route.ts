import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

// GET /api/admin-panel/organizations/[id]/overview
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orgId = params.id;

  const [usersSnap, storesSnap] = await Promise.all([
    adminDb.collection('users').where('organizationId', '==', orgId).get(),
    adminDb.collection('stores').where('organizationId', '==', orgId).get(),
  ]);

  const users = usersSnap.docs.map(d => {
    const data = d.data();
    return { id: d.id, name: data.name || '', email: data.email || '', role: data.role || '', status: data.status || 'active', avatarUrl: data.avatarUrl || '' };
  });

  const stores = storesSnap.docs.map(d => {
    const data = d.data();
    return { id: d.id, name: data.name || '', beneficiaryId: data.beneficiaryId || '', hidden: data.hidden || false };
  });

  const beneficiaries = users.filter(u => u.role === 'beneficiary');
  const mentors = users.filter(u => u.role === 'mentor');
  const coaches = users.filter(u => u.role === 'coach');
  const team = users.filter(u => u.role === 'organization' || u.role === 'team');

  return NextResponse.json({ beneficiaries, mentors, coaches, team, stores });
}
