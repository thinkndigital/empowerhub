"use client";

import { applyOrgColor } from './apply-org-color';

let cachedColor: string | null = null;
let fetchPromise: Promise<void> | null = null;

export function applyPlatformColor(): void {
  if (!fetchPromise) {
    fetchPromise = fetch('/api/public/site-config', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { cachedColor = d.config?.primaryColor || null; })
      .catch(() => {});
  }
  fetchPromise.then(() => {
    if (cachedColor) applyOrgColor(cachedColor);
  });
}
