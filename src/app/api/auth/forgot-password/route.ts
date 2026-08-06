import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { sendBrandedEmail } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

// Always responds with success regardless of whether the email exists, so
// this endpoint can't be used to enumerate registered accounts.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });

    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${SITE_URL}/login`,
      });
      await sendBrandedEmail(email, {
        subject: 'إعادة تعيين كلمة المرور — EmpowerHub',
        bodyHtml: 'وصلنا طلب لإعادة تعيين كلمة مرور حسابك في EmpowerHub. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.',
        ctaText: 'إعادة تعيين كلمة المرور',
        ctaLink: resetLink,
      });
    } catch (e: any) {
      // auth/user-not-found and similar — swallow silently so the response
      // doesn't reveal whether the email is registered.
      console.warn('[forgot-password] link generation failed:', e?.message || e);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
