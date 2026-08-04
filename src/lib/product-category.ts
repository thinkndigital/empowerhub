export const PRODUCT_CATEGORIES = [
  'مصنوعات يدوية',
  'طعام ومشروبات',
  'ملابس وأزياء',
  'حرف يدوية',
  'خدمات',
  'منتجات زراعية',
  'منزل وديكور',
  'أخرى',
];

// تصنيفات قديمة كانت تُحفظ بمفاتيح إنجليزية — نترجمها للعرض حتى لا تظهر بالإنجليزية
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  handmade: 'مصنوعات يدوية',
  food: 'طعام ومشروبات',
  clothing: 'ملابس وأزياء',
  crafts: 'حرف يدوية',
  services: 'خدمات',
  agriculture: 'منتجات زراعية',
  home: 'منزل وديكور',
  other: 'أخرى',
};

export function translateCategory(category?: string | null): string {
  if (!category) return '';
  return LEGACY_CATEGORY_LABELS[category.toLowerCase()] || category;
}
