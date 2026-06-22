import { adminStorage } from '@/lib/firebase-admin';

const PROJECT_ID = 'studio-4511819966-bc14f';

// Cached result so we only probe once per server instance
let cachedBucketName: string | null = null;

const CANDIDATE_BUCKETS = [
  process.env.FIREBASE_STORAGE_BUCKET,
  `${PROJECT_ID}.firebasestorage.app`,
  `${PROJECT_ID}.appspot.com`,
].filter(Boolean) as string[];

export async function getStorageBucket(): Promise<{ bucket: any; bucketName: string }> {
  if (cachedBucketName) {
    return { bucket: adminStorage.bucket(cachedBucketName), bucketName: cachedBucketName };
  }

  // Deduplicate candidates (env var might duplicate one of the defaults)
  const seen = new Set<string>();
  const candidates = CANDIDATE_BUCKETS.filter(n => { if (seen.has(n)) return false; seen.add(n); return true; });

  for (const name of candidates) {
    try {
      const b = adminStorage.bucket(name);
      const [exists] = await b.exists();
      if (exists) {
        cachedBucketName = name;
        return { bucket: b, bucketName: name };
      }
    } catch {
      // try next
    }
  }

  throw new Error(
    'Firebase Storage غير مفعّل. يرجى الذهاب إلى Firebase Console → Storage → Get Started لإنشاء المخزن.'
  );
}

export function buildDownloadUrl(bucketName: string, storagePath: string, token: string): string {
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('%2F');
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
}
