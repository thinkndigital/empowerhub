import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, description, gateway } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const configSnap = await adminDb.collection('config').doc('payment').get();
    const config = configSnap.exists ? configSnap.data() as any : {};
    const currency = config?.currency || 'JOD';

    const host = (req.headers.get('origin') || '').replace(/\/$/, '') || 'https://empowerhub.thinkndigital.com';
    const callbackUrl = `${host}/payment/callback?orderId=${orderId}&gateway=${gateway || 'moyasar'}`;

    // ─── Moyasar ─────────────────────────────────────────────────────────────
    if (!gateway || gateway === 'moyasar') {
      const gw = config?.moyasar || {};
      if (!gw.enabled) return NextResponse.json({ error: 'الدفع عبر موياسر غير مفعّل' }, { status: 400 });
      if (!gw.secretKey) return NextResponse.json({ error: 'مفتاح موياسر السري غير محدد' }, { status: 400 });

      const res = await fetch('https://api.moyasar.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${gw.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency,
          description: description || `طلب #${orderId}`,
          callback_url: callbackUrl,
          source: { type: 'creditcard' },
          metadata: { orderId },
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        return NextResponse.json({ error: e.message || 'خطأ في موياسر' }, { status: 500 });
      }
      const payment = await res.json();
      await adminDb.collection('orders').doc(orderId).update({ paymentId: payment.id, paymentGateway: 'moyasar' });
      return NextResponse.json({ ok: true, paymentUrl: payment.source?.transaction_url, paymentId: payment.id });
    }

    // ─── Stripe ──────────────────────────────────────────────────────────────
    if (gateway === 'stripe') {
      const gw = config?.stripe || {};
      if (!gw.enabled) return NextResponse.json({ error: 'الدفع عبر Stripe غير مفعّل' }, { status: 400 });
      if (!gw.secretKey) return NextResponse.json({ error: 'مفتاح Stripe السري غير محدد' }, { status: 400 });

      const params = new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
        'line_items[0][price_data][product_data][name]': description || `طلب #${orderId}`,
        'line_items[0][quantity]': '1',
        mode: 'payment',
        success_url: `${host}/payment/callback?orderId=${orderId}&gateway=stripe&status=paid`,
        cancel_url: `${host}/payment/callback?orderId=${orderId}&gateway=stripe&status=failed`,
        'metadata[orderId]': orderId,
      });
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gw.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      if (!res.ok) {
        const e = await res.json();
        return NextResponse.json({ error: e.error?.message || 'خطأ في Stripe' }, { status: 500 });
      }
      const session = await res.json();
      await adminDb.collection('orders').doc(orderId).update({ paymentId: session.id, paymentGateway: 'stripe' });
      return NextResponse.json({ ok: true, paymentUrl: session.url, paymentId: session.id });
    }

    // ─── PayPal ──────────────────────────────────────────────────────────────
    if (gateway === 'paypal') {
      const gw = config?.paypal || {};
      if (!gw.enabled) return NextResponse.json({ error: 'الدفع عبر PayPal غير مفعّل' }, { status: 400 });
      if (!gw.clientId || !gw.clientSecret) return NextResponse.json({ error: 'بيانات PayPal غير مكتملة' }, { status: 400 });

      const baseUrl = gw.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${gw.clientId}:${gw.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) return NextResponse.json({ error: 'فشل التحقق من PayPal' }, { status: 500 });

      const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ amount: { currency_code: currency, value: amount.toFixed(2) }, description }],
          application_context: {
            return_url: `${host}/payment/callback?orderId=${orderId}&gateway=paypal&status=paid`,
            cancel_url: `${host}/payment/callback?orderId=${orderId}&gateway=paypal&status=failed`,
          },
        }),
      });
      const ppOrder = await orderRes.json();
      const approveLink = ppOrder.links?.find((l: any) => l.rel === 'approve')?.href;
      if (!approveLink) return NextResponse.json({ error: 'فشل إنشاء طلب PayPal' }, { status: 500 });
      await adminDb.collection('orders').doc(orderId).update({ paymentId: ppOrder.id, paymentGateway: 'paypal' });
      return NextResponse.json({ ok: true, paymentUrl: approveLink, paymentId: ppOrder.id });
    }

    // ─── PayTabs ─────────────────────────────────────────────────────────────
    if (gateway === 'paytabs') {
      const gw = config?.paytabs || {};
      if (!gw.enabled) return NextResponse.json({ error: 'الدفع عبر PayTabs غير مفعّل' }, { status: 400 });
      if (!gw.profileId || !gw.serverKey) return NextResponse.json({ error: 'بيانات PayTabs غير مكتملة (Profile ID أو Server Key)' }, { status: 400 });

      const regionBaseUrls: Record<string, string> = {
        SAU: 'https://secure.paytabs.sa',
        ARE: 'https://secure.paytabs.com',
        EGY: 'https://secure-egypt.paytabs.com',
        OMN: 'https://secure-oman.paytabs.com',
        JOR: 'https://secure-jordan.paytabs.com',
        IRQ: 'https://secure-iraq.paytabs.com',
      };
      const ptBase = regionBaseUrls[gw.region] || regionBaseUrls['SAU'];

      const res = await fetch(`${ptBase}/payment/request`, {
        method: 'POST',
        headers: { 'authorization': gw.serverKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: Number(gw.profileId),
          tran_type: 'sale',
          tran_class: 'ecom',
          cart_id: String(orderId),
          cart_description: description || `طلب #${orderId}`,
          cart_currency: currency,
          cart_amount: Number(amount),
          callback: callbackUrl,
          return: `${host}/payment/callback?orderId=${orderId}&gateway=paytabs`,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        const errMsg = e.message || e.payment_result?.response_message || `PayTabs error ${res.status}`;
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
      const pt = await res.json();
      await adminDb.collection('orders').doc(orderId).update({ paymentId: pt.tran_ref, paymentGateway: 'paytabs' });
      return NextResponse.json({ ok: true, paymentUrl: pt.redirect_url, paymentId: pt.tran_ref });
    }

    // ─── HyperPay ────────────────────────────────────────────────────────────
    // Not wired up end-to-end yet: it needs a Copy&amp;Pay widget page plus a
    // server-side payment-status check (HyperPay doesn't redirect back with a
    // simple ?status=paid like the other gateways). Rejected explicitly here
    // instead of silently redirecting to a page that doesn't exist.
    if (gateway === 'hyperpay') {
      return NextResponse.json({ error: 'الدفع عبر HyperPay غير مدعوم حالياً — يرجى اختيار وسيلة دفع أخرى.' }, { status: 400 });
    }

    // ─── Tamara ──────────────────────────────────────────────────────────────
    if (gateway === 'tamara') {
      const gw = config?.tamara || {};
      if (!gw.enabled) return NextResponse.json({ error: 'الدفع عبر تمارا غير مفعّل' }, { status: 400 });
      if (!gw.apiKey) return NextResponse.json({ error: 'مفتاح تمارا غير محدد' }, { status: 400 });

      const res = await fetch('https://api.tamara.co/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${gw.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_reference_id: orderId,
          total_amount: { amount: amount.toFixed(2), currency },
          description: description || `طلب #${orderId}`,
          success_url: `${host}/payment/callback?orderId=${orderId}&gateway=tamara&status=paid`,
          failure_url: `${host}/payment/callback?orderId=${orderId}&gateway=tamara&status=failed`,
          cancel_url: `${host}/payment/callback?orderId=${orderId}&gateway=tamara&status=failed`,
          items: [{ name: description || orderId, sku: orderId, quantity: 1, unit_price: { amount: amount.toFixed(2), currency }, total_amount: { amount: amount.toFixed(2), currency } }],
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        return NextResponse.json({ error: e.message || 'خطأ في تمارا' }, { status: 500 });
      }
      const tm = await res.json();
      await adminDb.collection('orders').doc(orderId).update({ paymentId: tm.order_id, paymentGateway: 'tamara' });
      return NextResponse.json({ ok: true, paymentUrl: tm.checkout_url, paymentId: tm.order_id });
    }

    // ─── Tabby ───────────────────────────────────────────────────────────────
    if (gateway === 'tabby') {
      const gw = config?.tabby || {};
      if (!gw.enabled) return NextResponse.json({ error: 'الدفع عبر تابي غير مفعّل' }, { status: 400 });
      if (!gw.apiKey) return NextResponse.json({ error: 'مفتاح تابي غير محدد' }, { status: 400 });

      const res = await fetch('https://api.tabby.ai/api/v2/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${gw.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment: {
            amount: amount.toFixed(2),
            currency,
            description: description || `طلب #${orderId}`,
            buyer: { name: 'عميل', email: 'customer@empowerhub.com' },
            order: { reference_id: orderId, items: [{ title: description || orderId, quantity: 1, unit_price: amount.toFixed(2) }] },
          },
          merchant_code: 'empowerhub',
          merchant_urls: {
            success: `${host}/payment/callback?orderId=${orderId}&gateway=tabby&status=paid`,
            cancel: `${host}/payment/callback?orderId=${orderId}&gateway=tabby&status=failed`,
            failure: `${host}/payment/callback?orderId=${orderId}&gateway=tabby&status=failed`,
          },
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        return NextResponse.json({ error: e.error || 'خطأ في تابي' }, { status: 500 });
      }
      const tb = await res.json();
      const paymentUrl = tb.configuration?.available_products?.installments?.[0]?.web_url;
      await adminDb.collection('orders').doc(orderId).update({ paymentId: tb.id, paymentGateway: 'tabby' });
      return NextResponse.json({ ok: true, paymentUrl: paymentUrl || tb.configuration?.available_products?.pay_later?.[0]?.web_url, paymentId: tb.id });
    }

    return NextResponse.json({ error: 'بوابة الدفع غير معروفة' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
