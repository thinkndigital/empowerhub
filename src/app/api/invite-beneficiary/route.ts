import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendBrandedEmail } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

// POST { email, orgId, groupName? }
// Creates a record in orgInvitations and returns { success: true }
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

    const invitation: Record<string, unknown> = {
      orgId,
      targetEmail: email,
      targetRole: 'beneficiary',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    };

    if (groupName) {
      invitation.groupName = groupName;
    }

    await adminDb.collection('orgInvitations').add(invitation);

    try {
      const orgSnap = await adminDb.collection('organizations').doc(orgId).get();
      const orgName = orgSnap.data()?.name || 'منظمة';
      await sendBrandedEmail(email, {
        subject: `دعوة للانضمام إلى ${orgName} على EmpowerHub`,
        bodyHtml: `دعتك منظمة <strong>${orgName}</strong> للانضمام إلى منصة EmpowerHub كمستفيد${groupName ? ` ضمن مجموعة ${groupName}` : ''}. أنشئ حسابك للبدء.`,
        ctaText: 'إنشاء حساب',
        ctaLink: `${SITE_URL}/register`,
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('invite-beneficiary error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
