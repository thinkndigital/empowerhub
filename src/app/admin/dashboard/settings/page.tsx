"use client";

import { useState } from "react";
import { Shield, Key, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loggingout, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.push("/admin");
  };

  return (
    <div className="space-y-6 max-w-lg" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
        <p className="text-slate-400 text-sm">إعدادات لوحة الإدارة</p>
      </div>

      <Card className="bg-slate-800/50 border-white/10">
        <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />معلومات الجلسة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-400 text-sm">اسم المستخدم</span>
            <span className="text-white text-sm font-mono">admin</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-400 text-sm">الصلاحية</span>
            <span className="text-emerald-400 text-sm">مشرف عام</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-white/10">
        <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Info className="h-4 w-4 text-blue-400" />معلومات المنصة</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between text-slate-400 p-2">
            <span>المنصة</span><span className="text-white">EmpowerHub</span>
          </div>
          <div className="flex justify-between text-slate-400 p-2">
            <span>Firebase Project</span><span className="text-white font-mono text-xs">studio-4511819966-bc14f</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleLogout}
        disabled={loggingout}
        variant="destructive"
        className="w-full"
      >
        {loggingout ? "جاري الخروج..." : "تسجيل الخروج"}
      </Button>
    </div>
  );
}
