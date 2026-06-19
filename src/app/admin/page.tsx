"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-panel/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "فشل تسجيل الدخول");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative w-full max-w-md px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="bg-primary/20 p-4 rounded-2xl">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">لوحة الإدارة</h1>
              <p className="text-slate-400 text-sm mt-1">EmpowerHub Control Panel</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">اسم المستخدم</Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-primary"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-primary pl-10"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-base mt-2"
              disabled={loading}
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-xs mt-4">EmpowerHub © 2026</p>
      </div>
    </div>
  );
}
