"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useUser();
  const [status, setStatus] = useState<'loading' | 'paid' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [isCourseOrder, setIsCourseOrder] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    setInIframe(window !== window.parent);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const orderId = searchParams.get('orderId');
    const gateway = searchParams.get('gateway') || 'moyasar';

    if (!orderId) { setStatus('failed'); setMessage('رقم الطلب غير موجود'); return; }

    // Determine success based on gateway-specific params
    let isPaid = false;
    if (gateway === 'moyasar') {
      isPaid = searchParams.get('status') === 'paid';
    } else if (gateway === 'paytabs') {
      const respStatus = searchParams.get('respStatus') || searchParams.get('response_status');
      isPaid = respStatus === 'A';
    } else if (gateway === 'stripe') {
      isPaid = searchParams.get('status') === 'paid';
    } else {
      isPaid = searchParams.get('status') === 'paid';
    }

    if (isPaid) {
      fetch('/api/public/orders/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus: 'paid', status: 'confirmed', gateway }),
      })
        .then(r => r.json())
        .then(async (data) => {
          if (data.order?.type === 'course' && data.order?.courseId && authUser) {
            const cId = data.order.courseId;
            setCourseId(cId);
            setIsCourseOrder(true);
            try {
              const token = await authUser.getIdToken();
              await fetch(`/api/courses/${cId}/enroll`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
                body: JSON.stringify({}),
              });
            } catch { /* non-fatal */ }
          }
        })
        .catch(() => {});

      setStatus('paid');
      setMessage(`تم الدفع بنجاح! رقم طلبك: ${orderId}`);
    } else {
      const failMsg = searchParams.get('message') || searchParams.get('respMessage') || 'فشل الدفع. يمكنك المحاولة مرة أخرى.';
      setStatus('failed');
      setMessage(failMsg);
    }
  }, [searchParams, authUser, authLoading]);

  // Send postMessage to parent when inside iframe
  useEffect(() => {
    if (status === 'loading' || !inIframe) return;
    const orderId = searchParams.get('orderId');
    window.parent.postMessage({ type: 'payment-result', status, orderId }, '*');
  }, [status, inIframe, searchParams]);

  // Simplified iframe UI — parent dialog handles the full UX
  if (inIframe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center px-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground text-sm">جاري التحقق من الدفع...</p>
            </>
          )}
          {status === 'paid' && (
            <>
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="font-bold text-lg">تم الدفع بنجاح!</p>
            </>
          )}
          {status === 'failed' && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="font-bold text-lg">لم يتم الدفع</p>
              <p className="text-muted-foreground text-sm mt-1">{message}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Full standalone page
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
            <div className="flex flex-col gap-2">
              {isCourseOrder && authUser && courseId && (
                <Button asChild className="w-full">
                  <Link href={`/dashboard/training/${courseId}`}>ابدأ الدورة الآن</Link>
                </Button>
              )}
              {isCourseOrder && !authUser && (
                <Button asChild className="w-full">
                  <Link href="/login">سجّل الدخول للوصول للدورة</Link>
                </Button>
              )}
              <Button asChild variant={isCourseOrder ? 'outline' : 'default'} className="w-full">
                <Link href={isCourseOrder ? '/dashboard/training' : '/market'}>
                  {isCourseOrder ? 'دوراتي' : 'العودة للمتجر'}
                </Link>
              </Button>
            </div>
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
