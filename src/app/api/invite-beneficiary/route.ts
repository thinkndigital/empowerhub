import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orgInvitations } from '@/lib/schema';
import { randomUUID } from 'crypto';

// POST { email, orgId, groupName? }
// Creates a record in org_invitations and returns { success: true }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, orgId, groupName } = body as {
      email: string;
      orgId: string;
      groupName?: string;
    };

    if (!email || !orgId) {
      return NextResponse.json(
        { error: 'email and orgId are required' },
        { status: 400 },
      );
    }

    await db.insert(orgInvitations).values({
      id: randomUUID(),
      organizationId: orgId,
      targetEmail: email,
      targetRole: 'beneficiary',
      groupName: groupName || null,
      status: 'pending',
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('invite-beneficiary error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
