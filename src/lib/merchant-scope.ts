import { adminDb } from '@/lib/firebase-admin';
import type { MerchantPermission } from '@/lib/merchant-permissions';

export type { MerchantPermission };

export interface MerchantScope {
  merchantId: string;
  merchantName: string;
  isOwner: boolean;
  isAdmin: boolean;
  permissions: string[];
}

// Resolves who a request should actually operate on: the requester
// themselves if they're a real merchant, or the store owner they were
// invited by if they're a merchant_staff team member.
export async function resolveMerchantScope(uid: string): Promise<MerchantScope> {
  const userDoc = await adminDb.collection('users').doc(uid).get();
  const data = userDoc.data() || {};

  if (data.role === 'merchant_staff' && data.merchantId) {
    const ownerDoc = await adminDb.collection('users').doc(data.merchantId).get();
    return {
      merchantId: data.merchantId,
      merchantName: ownerDoc.data()?.name || '',
      isOwner: false,
      isAdmin: data.merchantRole === 'admin',
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
  }

  return {
    merchantId: uid,
    merchantName: data.name || '',
    isOwner: true,
    isAdmin: true,
    permissions: [],
  };
}

export function hasMerchantPermission(scope: MerchantScope, permission: MerchantPermission): boolean {
  if (scope.isOwner || scope.isAdmin) return true;
  return scope.permissions.includes(permission);
}
