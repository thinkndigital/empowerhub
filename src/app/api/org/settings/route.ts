import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

async function resolveOrgId(token: string): Promise<string | null> {
  const decoded = await verifyAuthToken(token);
  let orgId = decoded.organizationId;
  if (!orgId) {
    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    orgId = userRow?.organizationId;
  }
  return orgId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const orgId = await resolveOrgId(token);
    if (!orgId) return NextResponse.json({ error: 'ليس مدير منظمة' }, { status: 403 });
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    return NextResponse.json({ org: org || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const orgId = await resolveOrgId(token);
    if (!orgId) return NextResponse.json({ error: 'ليس مدير منظمة' }, { status: 403 });

    const body = await req.json();

    // Organizations may only edit their own operational settings — brand
    // color (primaryColor) is admin-only and managed from the admin panel.
    const allowedFields = ['name', 'logoUrl', 'courseSessionPrice', 'mentorshipSessionPrice'];
    const fieldMap: Record<string, string> = { logoUrl: 'logoUrl', courseSessionPrice: 'courseSessionPrice', mentorshipSessionPrice: 'mentorshipSessionPrice', name: 'name' };

    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
      if (allowedFields.includes(k) && v !== undefined && v !== null) clean[fieldMap[k]] = v;
    }

    await db.update(organizations).set(clean).where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: `فشل حفظ إعدادات الجهة: ${e.message}` },
      { status: 500 },
    );
  }
}
