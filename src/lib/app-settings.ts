import { db } from './db';
import { appSettings } from './schema';
import { eq } from 'drizzle-orm';

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Mirrors Firestore's `set(data, { merge: true })` — nested maps are merged
// recursively, arrays and primitives are replaced outright.
function deepMerge(base: Record<string, any>, patch: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...base };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    const baseVal = base[key];
    result[key] = isPlainObject(patchVal) && isPlainObject(baseVal)
      ? deepMerge(baseVal, patchVal)
      : patchVal;
  }
  return result;
}

export async function getSetting<T = any>(key: string): Promise<T | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return (row?.value ?? null) as T | null;
}

export async function patchSetting(key: string, patch: Record<string, any>): Promise<void> {
  const existing = await getSetting<Record<string, any>>(key);
  const merged = deepMerge(existing || {}, patch);
  await db.insert(appSettings).values({ key, value: merged })
    .onDuplicateKeyUpdate({ set: { value: merged } });
}
