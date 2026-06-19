"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'paid' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const moyasarStatus = searchParams.get('status');
    const moyasarMessage = searchParams.get('message');

    if (!orderId) { setStatus('failed'); setMessage('رقم الطلب غير موجود'); return; }

    if (moyasarStatus === 'paid') {
      // Update order payment status
      fetch(`/api/public/orders/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus: 'paid', status: 'confirmed' }),
      }).catch(() => {});
      setStatus('paid');
      setMessage(`تم الدفع بنجاح! رقم طلبك: ${orderId}`);
    } else {
      setStatus('failed');
      setMessage(moyasarMessage || 'فشل الدفع. يمكنك المحاولة مرة أخرى.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center max-w-sm px-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">جاري التحقق من الدفع...</p>
          </>
        )}
        {status === 'paid' && (
          <>
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">تم الدفع بنجاح!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button asChild className="w-full"><Link href="/market">العودة للمتجر</Link></Button>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">لم يتم الدفع</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button variant="outline" asChild className="w-full"><Link href="/market">العودة للمتجر</Link></Button>
          </>
        )}
      </div>
    </div>
  );
}
