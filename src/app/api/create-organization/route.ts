import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgName, adminName, adminEmail, adminPassword = 'EmpowerHub@2024' } = body;

    if (!orgName || !adminName || !adminEmail) {
      return NextResponse.json({ error: 'orgName, adminName, and adminEmail are required' }, { status: 400 });
    }

    // 1. Create the organization document
    const orgRef = adminDb.collection('organizations').doc();
    const orgId = orgRef.id;

    await orgRef.set({
      id: orgId,
      name: orgName,
      status: 'نشطة',
      createdAt: new Date().toISOString(),
    });

    // 2. Create the organization admin user
    const userRecord = await adminAuth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminName,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name: adminName,
      email: adminEmail,
      role: 'organization',
      organizationId: orgId,
      status: 'نشط',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      orgId,
      uid: userRecord.uid,
      message: `تم إنشاء المنظمة "${orgName}" وحساب المدير. كلمة المرور: ${adminPassword}`,
    });

  } catch (error: any) {
    console.error('Create organization error:', error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
