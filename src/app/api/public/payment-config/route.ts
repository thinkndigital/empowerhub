import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/app-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const d = (await getSetting<any>('payment')) || {};
    // Only return public fields (never expose secret keys)
    return NextResponse.json({
      config: {
        allowCOD: d.allowCOD ?? true,
        codLabel: d.codLabel || 'الدفع عند الاستلام',
        currency: d.currency || 'JOD',
        // expose only enabled flag + label per gateway (no keys)
        moyasar: { enabled: d.moyasar?.enabled ?? false, label: d.moyasar?.label || 'موياسر' },
        stripe: { enabled: d.stripe?.enabled ?? false, label: d.stripe?.label || 'Stripe' },
        paypal: { enabled: d.paypal?.enabled ?? false, label: d.paypal?.label || 'PayPal' },
        paytabs: { enabled: d.paytabs?.enabled ?? false, label: d.paytabs?.label || 'PayTabs' },
        hyperpay: { enabled: d.hyperpay?.enabled ?? false, label: d.hyperpay?.label || 'HyperPay' },
        tamara: { enabled: d.tamara?.enabled ?? false, label: d.tamara?.label || 'تمارا' },
        tabby: { enabled: d.tabby?.enabled ?? false, label: d.tabby?.label || 'تابي' },
      },
    });
  } catch {
    return NextResponse.json({ config: { allowCOD: true, codLabel: 'الدفع عند الاستلام', currency: 'JOD', moyasar: { enabled: false }, stripe: { enabled: false }, paypal: { enabled: false }, paytabs: { enabled: false }, hyperpay: { enabled: false }, tamara: { enabled: false }, tabby: { enabled: false } } });
  }
}
