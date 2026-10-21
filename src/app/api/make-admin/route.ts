import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// One-time endpoint to promote a user to admin by email
// Usage: POST /api/make-admin with { email, secret }
export async function POST(req: NextRequest) {
  const { email, secret } = await req.json();

  // Simple secret to prevent unauthorized use
  if (secret !== 'empowerhub-setup-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const [userRow] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!userRow) {
    return NextResponse.json({ error: 'User not found. Login first to create a profile.' }, { status: 404 });
  }

  await db.update(users).set({ role: 'admin' }).where(eq(users.id, userRow.id));

  return NextResponse.json({ success: true, message: `${email} is now an admin.` });
}
