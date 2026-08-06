import { getCachedSiteBranding } from '@/lib/site-branding-cache';
import { LoginClient } from './login-client';

// Same reasoning as the root layout's platform-brand cache: without this,
// this route can get fully static-prerendered at build time and never see a
// later branding update until the next deploy.
export const revalidate = 60;

export default async function LoginPage() {
  const { authBranding } = await getCachedSiteBranding();
  return <LoginClient initialBranding={authBranding} />;
}
