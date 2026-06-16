import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, organizationName } = body;

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
      });
    }

    // 3. Create user document in Firestore
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

    await adminDb.collection('users').doc(uid).set(userData);

    return NextResponse.json({
      success: true,
      uid,
      organizationId,
      message: 'تم إنشاء الحساب بنجاح.',
    });

  } catch (error: any) {
    console.error('Register error:', error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مستخدم بالفعل.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
