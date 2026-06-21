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

  useEffect(() => {
    if (authLoading) return;

    const orderId = searchParams.get('orderId');
    const moyasarStatus = searchParams.get('status');
    const moyasarMessage = searchParams.get('message');

    if (!orderId) { setStatus('failed'); setMessage('رقم الطلب غير موجود'); return; }

    if (moyasarStatus === 'paid') {
      // Update order payment status
      fetch('/api/public/orders/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus: 'paid', status: 'confirmed' }),
      })
        .then(r => r.json())
        .then(async (data) => {
          // Check if this is a course order and enroll the user
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
      setStatus('failed');
      setMessage(moyasarMessage || 'فشل الدفع. يمكنك المحاولة مرة أخرى.');
    }
  }, [searchParams, authUser, authLoading]);

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
