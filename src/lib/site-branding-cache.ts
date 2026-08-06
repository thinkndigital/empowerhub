import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';

export interface BrandingBlock {
  imageUrl: string;
  title: string;
  subtitle: string;
}

const EMPTY_BRANDING: BrandingBlock = { imageUrl: '', title: '', subtitle: '' };

// Login/register hero images used to be fetched client-side after first
// paint, so visitors briefly saw the wrong (stock/previous) image before it
// swapped to the admin-configured one. Resolving it server-side — same
// pattern as the platform logo/favicon in layout.tsx — means the correct
// image is already in the HTML on first paint.
export const getCachedSiteBranding = unstable_cache(
  async (): Promise<{ authBranding: BrandingBlock; registerBranding: BrandingBlock }> => {
    try {
      const snap = await adminDb.collection('config').doc('site').get();
      const data = snap.data() || {};
      const authBranding: BrandingBlock = data.authBranding || EMPTY_BRANDING;
      // registerBranding is the register page's own image/text; fall back to
      // authBranding (used by /login) for sites configured before it existed.
      const registerBranding: BrandingBlock = data.registerBranding?.imageUrl ? data.registerBranding : authBranding;
      return { authBranding, registerBranding };
    } catch {
      return { authBranding: EMPTY_BRANDING, registerBranding: EMPTY_BRANDING };
    }
  },
  ['site-branding'],
  { revalidate: 60 },
);
