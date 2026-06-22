import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await adminDb.collection('projects').doc(params.id).get();
    if (!doc.exists) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    const project = doc.data()!;
    if (project.status !== 'published') {
      return NextResponse.json({ error: 'المشروع غير متاح' }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, ...rest } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    // Validate required fields from registrationForm
    const formFields = project.registrationForm?.fields || {};
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
        const decoded = await adminAuth.verifyIdToken(token);
        userId = decoded.uid;
      } catch { /* guest */ }
    }

    const regRef = await adminDb
      .collection('projects')
      .doc(params.id)
      .collection('registrations')
      .add({
        name,
        email,
        ...rest,
        submittedAt: FieldValue.serverTimestamp(),
        ...(userId ? { userId } : {}),
      });

    return NextResponse.json({ id: regRef.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
