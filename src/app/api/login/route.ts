import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, signAuthToken } from '@/lib/auth-server';
import { ensureSchemaAndAdmin } from '@/lib/ensure-schema';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // Auto-create tables (from schema.sql) and seed the initial admin row
    // on first successful DB connection — no manual phpMyAdmin import or
    // /setup step needed once DB_* env vars are correct. Swallowed on
    // failure (e.g. DB still unreachable) so the break-glass fallback below
    // still works in the meantime.
    await ensureSchemaAndAdmin().catch((e) =>
      console.error('[ensureSchema] skipped:', e?.cause?.code || e?.code, e?.cause?.sqlMessage || e?.message)
    );

    // Break-glass admin login: bypasses the database entirely when
    // ADMIN_EMAIL/ADMIN_PASSWORD are set, so the dashboard is reachable even
    // if MySQL connectivity is still broken. Data-fetching routes still need
    // a working DB connection, but at least login itself no longer blocks on it.
    if (
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = signAuthToken({ uid: 'env-admin', role: 'admin', organizationId: null });
      return NextResponse.json({
        success: true,
        token,
        user: {
          uid: 'env-admin',
          name: 'Admin',
          email: process.env.ADMIN_EMAIL,
          role: 'admin',
          organizationId: null,
          avatarUrl: null,
        },
      });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const token = signAuthToken({ uid: user.id, role: user.role, organizationId: user.organizationId });

    return NextResponse.json({
      success: true,
      token,
      user: {
        uid: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
