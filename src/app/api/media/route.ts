import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getStorageBucket, buildDownloadUrl } from '@/lib/storage-bucket';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;  // 20 MB

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    await adminAuth.verifyIdToken(token);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم (يُقبل: JPEG، PNG، GIF، WEBP، SVG، MP4، WEBM، MOV)' },
        { status: 400 },
      );
    }
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `حجم الملف يتجاوز الحد الأقصى (${isVideo ? '20' : '5'} ميجابايت)` },
        { status: 400 },
      );
    }

    const folder = (formData.get('folder') as string) || 'uploads';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const storagePath = `${folder}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadToken = crypto.randomUUID();

    const { bucket, bucketName } = await getStorageBucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, { contentType: file.type, resumable: false });
    await fileRef.setMetadata({
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    });

    const url = buildDownloadUrl(bucketName, storagePath, downloadToken);
    return NextResponse.json({ url, path: storagePath });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
