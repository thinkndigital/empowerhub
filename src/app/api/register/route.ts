import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, organizationName, orgInviteCode } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // 1. Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;
    let organizationId: string | undefined;

    // 2. If registering as organization admin, create the org document
    if (role === 'organization') {
      const orgRef = adminDb.collection('organizations').doc();
      organizationId = orgRef.id;
      await orgRef.set({
        id: organizationId,
        name: organizationName || name,
        adminId: uid,
        status: 'نشطة',
        createdAt: new Date().toISOString(),
        primaryColor: '#2563eb',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
    }

    // 3. If registering as mentor/coach with a non-empty invite code, validate and link to org
    if ((role === 'mentor' || role === 'coach') && orgInviteCode && orgInviteCode.trim()) {
      const orgsSnapshot = await adminDb.collection('organizations')
        .where('inviteCode', '==', orgInviteCode.trim().toUpperCase())
        .limit(1)
        .get();

      if (!orgsSnapshot.empty) {
        organizationId = orgsSnapshot.docs[0].id;
      } else {
        await adminAuth.deleteUser(uid);
        return NextResponse.json(
          { error: 'كود الدعوة غير صحيح. تأكد من الكود وحاول مرة أخرى.' },
          { status: 400 }
        );
      }
    }

    // 4. Set custom claim so client can read role without Firestore
    const claims: Record<string, any> = { role };
    if (organizationId) claims.organizationId = organizationId;
    await adminAuth.setCustomUserClaims(uid, claims);

    // 5. Create user document in Firestore (best-effort)
    const userData: Record<string, any> = {
      id: uid,
      name,
      email,
      role,
      status: 'نشط',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    if (organizationId) userData.organizationId = organizationId;

    try { await adminDb.collection('users').doc(uid).set(userData); } catch {}

    return NextResponse.json({
      success: true,
      uid,
      organizationId,
      message: 'تم إنشاء الحساب بنجاح.',
    });

  } catch (error: any) {
    console.error('Register error:', error?.code, error?.message);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مستخدم بالفعل.' },
        { status: 400 }
      );
    }
    if (error.code === 'app/no-app' || error.message?.includes('credential') || error.message?.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { error: 'خطأ في إعدادات الخادم. تواصل مع الدعم الفني.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
