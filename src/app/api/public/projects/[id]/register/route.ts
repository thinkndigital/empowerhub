import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { projects, projectRegistrations } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
    if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    if (project.status !== 'published') {
      return NextResponse.json({ error: 'المشروع غير متاح' }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, ...rest } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    // Validate required fields from registrationForm
    const formFields = (project.registrationForm as any)?.fields || {};
    for (const [key, config] of Object.entries(formFields as Record<string, any>)) {
      if (config.enabled && config.required && !rest[key]) {
        return NextResponse.json({
          error: `الحقل "${config.label || key}" مطلوب`
        }, { status: 400 });
      }
    }

    // Try to get userId from token if present
    let userId: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = await verifyAuthToken(token);
        userId = decoded.uid;
      } catch { /* guest */ }
    }

    const id = randomUUID();
    await db.insert(projectRegistrations).values({
      id,
      projectId: params.id,
      name,
      email,
      userId: userId || null,
      answers: rest,
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
