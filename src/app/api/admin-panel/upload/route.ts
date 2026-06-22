import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminStorage } from '@/lib/firebase-admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024;
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'studio-4511819966-bc14f.firebasestorage.app';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function POST(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 5 ميجابايت' }, { status: 400 });
    }

    const folder = (formData.get('folder') as string) || 'admin-uploads';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const storagePath = `${folder}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadToken = crypto.randomUUID();
    const bucket = adminStorage.bucket(STORAGE_BUCKET);
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, { contentType: file.type, resumable: false });
    await fileRef.setMetadata({ metadata: { firebaseStorageDownloadTokens: downloadToken } });

    const encodedPath = storagePath.split('/').map(encodeURIComponent).join('%2F');
    const url = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url, path: storagePath });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
