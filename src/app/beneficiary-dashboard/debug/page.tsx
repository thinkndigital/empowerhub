"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export default function BeneficiaryDebugPage() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) { setError('لا يوجد مستخدم مسجل'); return; }
    setLoading(true); setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/beneficiary/debug', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) load(); }, [user]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">تشخيص بيانات المستفيد</h1>
        <Button size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          تحديث
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{error}</div>}
      {!data && !loading && !error && <p className="text-muted-foreground text-sm">جاري الانتظار...</p>}

      {loading && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}

      {data && (
        <div className="space-y-4">
          {/* User */}
          <Card>
            <CardHeader><CardTitle className="text-sm">المستخدم</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-1">
              <p><span className="font-medium">UID:</span> {data.uid}</p>
              <p><span className="font-medium">الاسم:</span> {data.userProfile?.name || '—'}</p>
              <p><span className="font-medium">الدور:</span> {data.userProfile?.role || '—'}</p>
              <p><span className="font-medium">المنظمة:</span> {data.userProfile?.organizationId || '—'}</p>
              <p><span className="font-medium">المرشد:</span> {data.userProfile?.mentorId || '—'}</p>
              <p><span className="font-medium">المدرب:</span> {data.userProfile?.coachId || '—'}</p>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader><CardTitle className="text-sm">الجلسات ({data.sessions.myCount} جلسة خاصة بي)</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              {data.sessions.mySessions.length === 0
                ? <p className="text-red-600">لا توجد جلسات مرتبطة بهذا المستخدم</p>
                : data.sessions.mySessions.map((s: any) => (
                    <div key={s.id} className="border rounded p-2">
                      <p><span className="font-medium">العنوان:</span> {s.title}</p>
                      <p><span className="font-medium">التاريخ:</span> {s.date}</p>
                      <p><span className="font-medium">الحالة:</span> {s.status}</p>
                    </div>
                  ))
              }
              <div className="mt-2 border-t pt-2">
                <p className="font-medium mb-1">عينة من كل الجلسات في النظام:</p>
                {data.sessions.sampleAllSessions.map((s: any) => (
                  <div key={s.id} className="text-[11px] border rounded p-1 mb-1">
                    <p>id: {s.id}</p>
                    <p>attendees: {JSON.stringify(s.attendees)}</p>
                    <p>beneficiaryId: {s.beneficiaryId || '—'}</p>
                    <p>hostId: {s.hostId || '—'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Courses */}
          <Card>
            <CardHeader><CardTitle className="text-sm">الدورات ({data.courses.allCount} دورة في النظام، {data.courses.myEnrollmentsCount} مسجل فيها)</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="font-medium">كل الدورات:</p>
              {data.courses.allCourses.map((c: any) => (
                <div key={c.id} className="border rounded p-1">
                  <span className="font-medium">{c.title}</span>
                  <Badge className="mr-2 text-[10px]" variant={c.status === 'published' || c.status === 'منشورة' ? 'default' : 'secondary'}>{c.status}</Badge>
                </div>
              ))}
              {data.courses.myEnrollments.length > 0 && (
                <>
                  <p className="font-medium mt-2">تسجيلاتي:</p>
                  {data.courses.myEnrollments.map((e: any) => (
                    <div key={e.courseId} className="border rounded p-1">
                      <p>{e.courseTitle} — تقدم: {e.progress}%</p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Store */}
          <Card>
            <CardHeader><CardTitle className="text-sm">المتجر والمنتجات</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-1">
              {data.store
                ? <><p className="text-green-700 font-medium">✓ المتجر موجود</p><p>الاسم: {data.store.name}</p><p>ID: {data.store.id}</p></>
                : <p className="text-red-600">لا يوجد متجر محفوظ لهذا المستخدم</p>
              }
              <p className="mt-2 font-medium">المنتجات: {data.products.length}</p>
              {data.products.map((p: any) => (
                <p key={p.id}>{p.name} — {p.status}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
