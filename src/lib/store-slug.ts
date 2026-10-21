import { db } from '@/lib/db';
import { stores } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
    const rows = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, candidate)).limit(5);
    const collides = rows.some(r => r.id !== excludeId);
    if (!collides) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}
