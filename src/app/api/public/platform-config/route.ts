import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snap = await adminDb.collection('config').doc('platform').get();
    const d = snap.exists ? snap.data() as any : {};
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
