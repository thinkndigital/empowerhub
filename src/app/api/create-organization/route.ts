import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { organizations, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgName, adminName, adminEmail, adminPassword = 'EmpowerHub@2024' } = body;

    if (!orgName || !adminName || !adminEmail) {
      return NextResponse.json({ error: 'orgName, adminName, and adminEmail are required' }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' }, { status: 400 });
    }

    // 1. Create the organization row
    const orgId = randomUUID();
    await db.insert(organizations).values({
      id: orgId,
      name: orgName,
      status: 'active',
    });

    // 2. Create the organization admin user
    const uid = randomUUID();
    const passwordHash = await hashPassword(adminPassword);
    await db.insert(users).values({
      id: uid,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'organization',
      organizationId: orgId,
      status: 'active',
      displayName: adminName,
    });

    return NextResponse.json({
      success: true,
      orgId,
      uid,
      message: `تم إنشاء المنظمة "${orgName}" وحساب المدير. كلمة المرور: ${adminPassword}`,
    });

  } catch (error: any) {
    console.error('Create organization error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
