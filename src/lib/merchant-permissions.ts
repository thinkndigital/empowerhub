// Pure constants — safe to import from client components. Keep this file
// free of firebase-admin imports (see merchant-scope.ts for the server-only
// logic that uses these).
export type MerchantPermission = 'store' | 'inventory' | 'orders' | 'customers' | 'reports' | 'content';

export const MERCHANT_PERMISSIONS: MerchantPermission[] = ['store', 'inventory', 'orders', 'customers', 'reports', 'content'];

export const MERCHANT_PERMISSION_LABELS: Record<MerchantPermission, string> = {
  store: 'متجري',
  inventory: 'المخزون والمنتجات',
  orders: 'الطلبات',
  customers: 'العملاء',
  reports: 'التقارير',
  content: 'محتوى السوشال ميديا',
};
