'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// ssr: false guarantees Firebase NEVER runs on the server
const FirebaseClientProviderInner = dynamic(
  () => import('@/firebase/client-provider').then(m => m.FirebaseClientProvider),
  { ssr: false }
);

export function FirebaseProviderDynamic({ children }: { children: ReactNode }) {
  return <FirebaseClientProviderInner>{children}</FirebaseClientProviderInner>;
}
