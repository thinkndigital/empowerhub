import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password = 'EmpowerHub@2024', role, organizationId, category, expertise } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 });
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
