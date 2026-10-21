import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, stores } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { stripPasswords } from '@/lib/auth-server';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

// GET /api/admin-panel/organizations/[id]/overview
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orgId = params.id;

  const [userRows, storeRows] = await Promise.all([
    db.select().from(users).where(eq(users.organizationId, orgId)),
    db.select().from(stores).where(eq(stores.organizationId, orgId)),
  ]);

  const allUsers = stripPasswords(userRows).map(u => ({
    id: u.id, name: u.name || '', email: u.email || '', role: u.role || '', status: u.status || 'active', avatarUrl: u.avatarUrl || '',
  }));

  const storesResult = storeRows.map(s => ({
    id: s.id, name: s.name || '', beneficiaryId: s.beneficiaryId || '', hidden: s.hidden || false,
  }));

  const beneficiaries = allUsers.filter(u => u.role === 'beneficiary');
  const mentors = allUsers.filter(u => u.role === 'mentor');
  const coaches = allUsers.filter(u => u.role === 'coach');
  const team = allUsers.filter(u => u.role === 'organization' || u.role === 'team_member');

  return NextResponse.json({ beneficiaries, mentors, coaches, team, stores: storesResult });
}
