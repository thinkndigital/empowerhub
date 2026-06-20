import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'مستفيد',
  mentor: 'مرشد',
  coach: 'مدرب',
  organization: 'مدير جهة',
  admin: 'مشرف',
};

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Get the current user's full profile from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) return NextResponse.json({ contacts: [] });
    const me = userDoc.data()!;
    const role = me.role || decoded.role;
    const orgId = me.organizationId || decoded.organizationId;

    let contacts: any[] = [];

    if (role === 'admin') {
      // Admin can message everyone
      const snap = await adminDb.collection('users').limit(100).get();
      contacts = snap.docs.filter(d => d.id !== uid).map(d => {
        const u = d.data();
        return { id: d.id, name: u.name || 'مستخدم', role: u.role || '', roleLabel: ROLE_LABELS[u.role] || u.role };
      });
    } else if (orgId) {
      // Fetch all users in the same organization
      const snap = await adminDb.collection('users').where('organizationId', '==', orgId).get();
      const orgUsers = snap.docs.filter(d => d.id !== uid).map(d => {
        const u = d.data();
        return { id: d.id, name: u.name || 'مستخدم', role: u.role || '', roleLabel: ROLE_LABELS[u.role] || u.role };
      });

      if (role === 'organization') {
        // Org manager can message everyone in the org
        contacts = orgUsers;
      } else if (role === 'mentor') {
        // Mentor can message their beneficiaries + org managers + admins
        contacts = orgUsers.filter(u => ['beneficiary', 'organization', 'admin'].includes(u.role));
      } else if (role === 'coach') {
        // Coach can message their beneficiaries + org managers + admins
        contacts = orgUsers.filter(u => ['beneficiary', 'organization', 'admin'].includes(u.role));
      } else if (role === 'beneficiary') {
        // Beneficiary can message their mentor, coach, and org managers
        contacts = orgUsers.filter(u => ['mentor', 'coach', 'organization', 'admin'].includes(u.role));
      }
    }

    // Sort by role priority then name
    const rolePriority: Record<string, number> = { organization: 0, admin: 1, mentor: 2, coach: 3, beneficiary: 4 };
    contacts.sort((a, b) => (rolePriority[a.role] ?? 5) - (rolePriority[b.role] ?? 5) || (a.name || '').localeCompare(b.name || '', 'ar'));

    return NextResponse.json({ contacts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
