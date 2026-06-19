import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snap = await adminDb.collection('plans').orderBy('order').get();
    const plans = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        nameEn: data.nameEn || '',
        key: data.key || d.id,
        description: data.description || '',
        priceMonthly: data.priceMonthly ?? 0,
        priceAnnual: data.priceAnnual ?? 0,
        currency: data.currency || 'SAR',
        color: data.color || '#6366f1',
        icon: data.icon || 'Star',
        highlighted: data.highlighted ?? false,
        features: data.features || [],
        limits: data.limits || {},
      };
    });
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ plans: [] });
  }
}
