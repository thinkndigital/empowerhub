import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin@2026';
const SESSION_VALUE = 'empowerhub-admin-2026-secret';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('ap_session', SESSION_VALUE, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  }
  return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ap_session', '', { maxAge: 0, path: '/' });
  return res;
}
