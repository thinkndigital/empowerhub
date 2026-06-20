import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'studio-4511819966-bc14f.firebasestorage.app';

export async function POST(req: NextRequest) {
  try {
    // Verify user identity but keep the raw token for Firebase Storage REST API
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم (يُقبل: JPEG، PNG، GIF، WEBP، SVG)' },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)' },
        { status: 400 },
      );
    }

    const folder = (formData.get('folder') as string) || 'uploads';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const storagePath = `${folder}/${fileName}`;

    const buffer = await file.arrayBuffer();

    // Use Firebase Storage REST API directly — avoids Admin SDK bucket resolution issues.
    // The user's verified ID token is accepted by Firebase Storage security rules.
    const uploadUrl =
      `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o` +
      `?name=${encodeURIComponent(storagePath)}&uploadType=media`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': file.type,
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Storage upload failed (${uploadRes.status})`);
    }

    const result = await uploadRes.json();
    const downloadToken = result.downloadTokens || '';
    const url =
      `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/` +
      `${encodeURIComponent(storagePath)}?alt=media` +
      (downloadToken ? `&token=${downloadToken}` : '');

    return NextResponse.json({ url, path: storagePath });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
