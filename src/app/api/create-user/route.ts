import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth-server';
import { checkOrgLimit, checkOrgLocked } from '@/lib/plan-limits';

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
        const limitCheck = await checkOrgLimit(organizationId, limitKey as 'maxUsers' | 'maxMentors');
        if (!limitCheck.allowed) {
          return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }
      }
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' }, { status: 400 });
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({
      id: uid,
      name,
      email,
      passwordHash,
      role,
      status: 'active',
      progress: 0,
      organizationId: organizationId || null,
      category: category || null,
      expertise: expertise || null,
      displayName: name,
    });

    return NextResponse.json({
      success: true,
      uid,
      message: `تم إنشاء الحساب بنجاح. كلمة المرور المؤقتة: ${password}`,
    });

  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
