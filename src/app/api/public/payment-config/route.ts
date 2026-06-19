import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snap = await adminDb.collection('config').doc('payment').get();
    const data = snap.exists ? snap.data() as any : {};
    // Only return public fields (never expose secret keys)
    return NextResponse.json({
      config: {
        enabled: data.enabled ?? false,
        allowCOD: data.allowCOD ?? true,
        codLabel: data.codLabel || 'الدفع عند الاستلام',
        onlineLabel: data.onlineLabel || 'الدفع الإلكتروني',
        currency: data.currency || 'SAR',
      },
    });
  } catch {
    return NextResponse.json({ config: { enabled: false, allowCOD: true, codLabel: 'الدفع عند الاستلام', onlineLabel: 'الدفع الإلكتروني', currency: 'SAR' } });
  }
}
