import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'studio-4511819966-bc14f.firebasestorage.app';

export async function POST(req: NextRequest) {
  try {
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

    const buffer = Buffer.from(await file.arrayBuffer());

    const downloadToken = crypto.randomUUID();
    const bucket = adminStorage.bucket(STORAGE_BUCKET);
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, { contentType: file.type, resumable: false });
    // setMetadata must be called separately — the nested `metadata.metadata`
    // key is the GCS convention for custom (user-defined) metadata fields.
    // Putting firebaseStorageDownloadTokens directly inside SaveOptions.metadata
    // treats it as a top-level GCS metadata field, which Firebase ignores.
    await fileRef.setMetadata({
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    });

    // Bucket name has only safe chars (no encoding needed); path segments need %2F.
    const encodedPath = storagePath.split('/').map(encodeURIComponent).join('%2F');
    const url = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url, path: storagePath });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
