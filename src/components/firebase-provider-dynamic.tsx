'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// ssr: false guarantees Firebase SDK is NEVER evaluated on the server.
// FirebaseClientProvider always renders children (even while services are null),
// so there is no window where children lack a FirebaseContext.
const FirebaseClientProviderInner = dynamic(
  () => import('@/firebase/client-provider').then(m => m.FirebaseClientProvider),
  { ssr: false }
);

export function FirebaseProviderDynamic({ children }: { children: ReactNode }) {
  return <FirebaseClientProviderInner>{children}</FirebaseClientProviderInner>;
}
