import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plans } from '@/lib/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await db.select().from(plans).orderBy(asc(plans.sortOrder));
    return NextResponse.json({
      plans: rows.map(p => ({
        id: p.id,
        name: p.name || '',
        nameEn: p.nameEn || '',
        key: p.key || p.id,
        description: p.description || '',
        priceMonthly: p.priceMonthly ?? 0,
        priceAnnual: p.priceAnnual ?? 0,
        currency: p.currency || 'JOD',
        color: p.color || '#6366f1',
        icon: p.icon || 'Star',
        highlighted: p.highlighted ?? false,
        features: p.features || [],
        limits: p.limits || {},
      })),
    });
  } catch {
    return NextResponse.json({ plans: [] });
  }
}
