import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/app-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const d = (await getSetting<any>('platform')) || {};
    return NextResponse.json({
      config: {
        platformName: d.platformName || 'EmpowerHub',
        platformTagline: d.platformTagline || 'منصة التمكين الرقمي',
        logoUrl: d.logoUrl || '',
        faviconUrl: d.faviconUrl || '',
        dashboardSections: d.dashboardSections || null,
      },
    });
  } catch {
    return NextResponse.json({ config: null });
  }
}
