import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

// Local-disk replacement for Firebase Storage. UPLOADS_DIR must point to a
// path OUTSIDE next-build/ (e.g. a sibling folder at the cPanel application
// root) so uploaded files survive every redeploy — next-build/ is replaced
// wholesale on each build. Falls back to ./uploads for local dev.
export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
}

export async function saveUploadedFile(
  file: File,
  folder: string
): Promise<{ url: string; path: string }> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `${randomUUID()}${ext ? '.' + ext : ''}`;
  const relativePath = `${folder}/${filename}`;
  const absoluteDir = path.join(getUploadsDir(), folder);
  await fs.mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(absoluteDir, filename), buffer);

  return { url: `/api/files/${relativePath}`, path: relativePath };
}

export async function deleteUploadedFile(relativePath: string): Promise<void> {
  try {
    await fs.unlink(path.join(getUploadsDir(), relativePath));
  } catch {
    // best-effort; ignore missing files
  }
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm',
  mov: 'video/quicktime', pdf: 'application/pdf',
};

export function contentTypeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return EXT_CONTENT_TYPES[ext] || 'application/octet-stream';
}
