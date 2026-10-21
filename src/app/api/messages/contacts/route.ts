import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { users, userBlocks } from '@/lib/schema';
import { eq, ne } from 'drizzle-orm';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'مستفيد',
  mentor: 'مرشد',
  coach: 'مدرب',
  organization: 'مدير جهة',
  admin: 'مشرف',
  merchant: 'تاجر',
};

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const uid = decoded.uid;

    const [me] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    if (!me) return NextResponse.json({ contacts: [] });
    const role = me.role || decoded.role;
    const orgId = me.organizationId || decoded.organizationId;

    const blockRows = await db.select().from(userBlocks).where(eq(userBlocks.blockerId, uid));
    const blockedUsers = blockRows.map(r => r.blockedId);

    let contacts: any[] = [];

    const toContact = (u: typeof users.$inferSelect) => ({
      id: u.id, name: u.name || 'مستخدم', role: u.role || '', roleLabel: ROLE_LABELS[u.role] || u.role,
    });

    if (role === 'admin') {
      const rows = await db.select().from(users).where(ne(users.id, uid)).limit(100);
      contacts = rows.map(toContact);
    } else if (role === 'merchant') {
      const rows = await db.select().from(users).where(eq(users.role, 'admin'));
      contacts = rows.filter(u => u.id !== uid).map(toContact);
    } else if (orgId) {
      const rows = await db.select().from(users).where(eq(users.organizationId, orgId));
      const orgUsers = rows.filter(u => u.id !== uid).map(toContact);

      if (role === 'organization') {
        contacts = orgUsers;
      } else if (role === 'mentor' || role === 'coach') {
        contacts = orgUsers.filter(u => ['beneficiary', 'organization', 'admin'].includes(u.role));
      } else if (role === 'beneficiary') {
        contacts = orgUsers.filter(u => ['mentor', 'coach', 'organization', 'admin'].includes(u.role));
      }
    }

    contacts = contacts.filter(c => !blockedUsers.includes(c.id));

    const rolePriority: Record<string, number> = { organization: 0, admin: 1, mentor: 2, coach: 3, beneficiary: 4, merchant: 5 };
    contacts.sort((a, b) => (rolePriority[a.role] ?? 5) - (rolePriority[b.role] ?? 5) || (a.name || '').localeCompare(b.name || '', 'ar'));

    return NextResponse.json({ contacts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
