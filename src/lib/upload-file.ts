"use client";

/**
 * Upload a file via /api/media (Admin SDK — no client-side Firebase Storage needed).
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(file: File, folder: string, token?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/media', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'فشل رفع الملف');
  return json.url as string;
}
