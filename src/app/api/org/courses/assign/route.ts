import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { users, enrollments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    let orgId = decoded.organizationId;
    if (!orgId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      orgId = userRow?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const { courseId, beneficiaryIds } = await req.json();
    if (!courseId || !beneficiaryIds?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // Single enrollments row per (course, user) — replaces the old dual
    // courses/{id}/enrollments + courseProgress Firestore write.
    for (const uid of beneficiaryIds) {
      await db.insert(enrollments).values({
        id: randomUUID(), courseId, userId: uid, progress: 0, assigned: true, enrolledBy: decoded.uid,
      }).onDuplicateKeyUpdate({ set: { assigned: true } });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
