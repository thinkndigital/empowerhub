"use client";

import { useState, useEffect } from "react";
import { Shield, Key, Info, Mail, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface EmailConfig {
  hasResendApiKey: boolean;
  fromName: string;
  fromAddress: string;
}

function EmailSettingsCard() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin-panel/email-config').then(r => r.json()).then(d => {
      if (d.config) {
        setConfig(d.config);
        setFromName(d.config.fromName || '');
        setFromAddress(d.config.fromAddress || '');
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin-panel/email-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resendApiKey: apiKeyInput, fromName, fromAddress }),
      });
      if (!res.ok) throw new Error('فشل الحفظ');
      toast({ title: "تم الحفظ", description: "تم تحديث إعدادات البريد الإلكتروني." });
      setApiKeyInput("");
      const d = await (await fetch('/api/admin-panel/email-config')).json();
      if (d.config) setConfig(d.config);
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />إعدادات البريد الإلكتروني</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          يُستخدم Resend لإرسال إيميلات الإشعارات، التوثيق، الدورات، الجلسات، والرسائل عبر المنصة.
        </p>
        <div className="space-y-1.5">
          <Label className="text-sm">مفتاح Resend API</Label>
          <Input
            type="password"
            dir="ltr"
            placeholder={config?.hasResendApiKey ? "•••••••••••••••• (محفوظ — اترك فارغاً للإبقاء عليه)" : "re_xxxxxxxxxxxx"}
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">اسم المرسل</Label>
          <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="EmpowerHub" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">بريد المرسل (يجب أن يكون على نطاق موثّق في Resend)</Label>
          <Input dir="ltr" value={fromAddress} onChange={e => setFromAddress(e.target.value)} placeholder="notifications@yourdomain.com" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4 ml-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ إعدادات البريد'}
        </Button>
      </CardContent>
    </Card>
  );
}

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
        <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground text-sm">إعدادات لوحة الإدارة</p>
      </div>

      <EmailSettingsCard />

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />معلومات الجلسة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground text-sm">اسم المستخدم</span>
            <span className="text-foreground text-sm font-mono">admin</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground text-sm">الصلاحية</span>
            <span className="text-emerald-400 text-sm">مشرف عام</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Info className="h-4 w-4 text-blue-400" />معلومات المنصة</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground p-2">
            <span>المنصة</span><span className="text-foreground">EmpowerHub</span>
          </div>
          <div className="flex justify-between text-muted-foreground p-2">
            <span>Firebase Project</span><span className="text-foreground font-mono text-xs">studio-4511819966-bc14f</span>
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
