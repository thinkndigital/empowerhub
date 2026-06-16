"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) { setError("الخدمة غير متاحة مؤقتاً."); return; }
    setLoading(true);
    setError("");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await setDoc(doc(firestore, "users", uid), {
        id: uid,
        name,
        email,
        role: "admin",
        status: "نشط",
        createdAt: new Date().toISOString(),
      });

      setDone(true);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("هذا البريد مستخدم بالفعل. حاول تسجيل الدخول.");
      } else {
        setError(err.message || "حدث خطأ غير متوقع.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full border-0 shadow-lg text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">تم الإعداد بنجاح!</h2>
            <p className="text-muted-foreground">تم إنشاء حساب المشرف العام. يمكنك الآن الدخول للوحة التحكم.</p>
            <div className="flex gap-3 justify-center pt-2">
              <Button asChild className="shadow-md">
                <Link href="/admin-dashboard">لوحة تحكم المشرف</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">تسجيل الدخول</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Logo className="h-16 w-16 mx-auto" />
          <h1 className="text-3xl font-bold">إعداد المنصة</h1>
          <p className="text-muted-foreground">أنشئ حساب المشرف العام لبدء استخدام المنصة</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              حساب المشرف العام
            </CardTitle>
            <CardDescription>هذا الحساب سيملك صلاحيات كاملة على المنصة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  placeholder="محمد أحمد"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  dir="ltr"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  type="password"
                  dir="ltr"
                  placeholder="8 أحرف على الأقل"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full shadow-md" disabled={loading}>
                {loading ? "جاري الإعداد..." : "إنشاء حساب المشرف"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">⚠️ ملاحظة أمنية</p>
          <p>هذه الصفحة مخصصة للإعداد الأولي فقط. بعد إنشاء الحساب، احذف هذه الصفحة أو قيّد الوصول إليها.</p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          لديك حساب مسبقاً؟{" "}
          <Link href="/login" className="text-primary underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
