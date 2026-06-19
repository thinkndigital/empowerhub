import { cookies } from 'next/headers';

const ADMIN_SESSION_VALUE = 'empowerhub-admin-2026-secret';

export function checkAdminSession(): boolean {
  const c = cookies().get('ap_session');
  return c?.value === ADMIN_SESSION_VALUE;
}

export { ADMIN_SESSION_VALUE };
