import { adminDb } from '@/lib/firebase-admin';

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9؀-ۿݐ-ݿ-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uniqueStoreSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  if (!base) return '';
  let candidate = base;
  let attempt = 1;
  while (true) {
    const snap = await adminDb.collection('stores').where('slug', '==', candidate).limit(5).get();
    const collides = snap.docs.some(d => d.id !== excludeId);
    if (!collides) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}
