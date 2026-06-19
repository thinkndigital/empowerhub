import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, description } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    // Load payment config from Firestore
    const configSnap = await adminDb.collection('config').doc('payment').get();
    const config = configSnap.exists ? configSnap.data() as any : {};

    if (!config?.enabled) {
      return NextResponse.json({ error: 'الدفع الإلكتروني غير مفعّل' }, { status: 400 });
    }

    const secretKey = config?.moyasarSecretKey;
    if (!secretKey) {
      return NextResponse.json({ error: 'مفتاح بوابة الدفع غير محدد' }, { status: 400 });
    }

    // Base URL for callback
    const host = req.headers.get('origin') || req.headers.get('x-forwarded-host') || 'https://empowerhub.thinkndigital.com';
    const callbackUrl = `${host}/payment/callback?orderId=${orderId}`;

    // Create Moyasar payment
    const amountInHalalas = Math.round(amount * 100);
    const moyasarRes = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInHalalas,
        currency: config?.currency || 'SAR',
        description: description || `طلب #${orderId}`,
        callback_url: callbackUrl,
        source: { type: 'creditcard' },
        metadata: { orderId },
      }),
    });

    if (!moyasarRes.ok) {
      const err = await moyasarRes.json();
      return NextResponse.json({ error: err.message || 'خطأ في بوابة الدفع' }, { status: 500 });
    }

    const payment = await moyasarRes.json();

    // Store payment ID in order
    await adminDb.collection('orders').doc(orderId).update({
      paymentId: payment.id,
      paymentGateway: 'moyasar',
    });

    const paymentUrl = payment.source?.transaction_url;
    return NextResponse.json({ ok: true, paymentUrl, paymentId: payment.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
