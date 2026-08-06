import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { checkOrgLimit, checkOrgLocked } from '@/lib/plan-limits';
import { notifyUser } from '@/lib/notify';
import { SITE_URL } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password = 'EmpowerHub@2024', role, organizationId, category, expertise } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 });
    }

    if (organizationId) {
      const lockCheck = await checkOrgLocked(organizationId);
      if (!lockCheck.allowed) {
        return NextResponse.json({ error: lockCheck.message }, { status: 403 });
      }
      const limitKey = role === 'beneficiary' ? 'maxUsers' : role === 'mentor' || role === 'coach' ? 'maxMentors' : null;
      if (limitKey) {
        const limitCheck = await checkOrgLimit(organizationId, limitKey);
        if (!limitCheck.allowed) {
          return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }
      }
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create Firestore document
    const userData: Record<string, any> = {
      id: userRecord.uid,
      name,
      email,
      role,
      status: 'نشط',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    if (organizationId) userData.organizationId = organizationId;
    if (category) userData.category = category;
    if (expertise) userData.expertise = expertise;

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    try {
      await notifyUser({
        uid: userRecord.uid,
        type: 'welcome',
        title: 'تم إنشاء حسابك في EmpowerHub',
        body: `أهلاً ${name}، تم إنشاء حسابك. بريدك: ${email}`,
        link: '/login',
        email: {
          subject: 'تم إنشاء حسابك في EmpowerHub',
          bodyHtml: `أهلاً ${name}،<br/>تم إنشاء حساب لك في منصة EmpowerHub.<br/><br/><strong>البريد الإلكتروني:</strong> ${email}<br/><strong>كلمة المرور المؤقتة:</strong> ${password}<br/><br/>ننصحك بتغيير كلمة المرور بعد أول تسجيل دخول.`,
          ctaText: 'تسجيل الدخول',
          ctaLink: `${SITE_URL}/login`,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: `تم إنشاء الحساب بنجاح. كلمة المرور المؤقتة: ${password}`,
    });

  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
