"use client";

import { useState, useEffect } from "react";
import { Shield, Key, Info, Mail, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";

interface EmailConfig {
  hasResendApiKey: boolean;
  fromName: string;
  fromAddress: string;
}

function EmailSettingsCard() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
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
      if (!res.ok) throw new Error(bi('فشل الحفظ', 'Save failed'));
      toast({ title: bi("تم الحفظ", "Saved"), description: bi("تم تحديث إعدادات البريد الإلكتروني.", "Email settings were updated.") });
      setApiKeyInput("");
      const d = await (await fetch('/api/admin-panel/email-config')).json();
      if (d.config) setConfig(d.config);
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{bi('إعدادات البريد الإلكتروني', 'Email Settings')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {bi('يُستخدم Resend لإرسال إيميلات الإشعارات، التوثيق، الدورات، الجلسات، والرسائل عبر المنصة.', 'Resend is used to send notification, verification, course, session, and message emails across the platform.')}
        </p>
        <div className="space-y-1.5">
          <Label className="text-sm">{bi('مفتاح Resend API', 'Resend API Key')}</Label>
          <Input
            type="password"
            dir="ltr"
            placeholder={config?.hasResendApiKey ? bi("•••••••••••••••• (محفوظ — اترك فارغاً للإبقاء عليه)", "•••••••••••••••• (saved — leave empty to keep it)") : "re_xxxxxxxxxxxx"}
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{bi('اسم المرسل', 'Sender name')}</Label>
          <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="EmpowerHub" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{bi('بريد المرسل (يجب أن يكون على نطاق موثّق في Resend)', 'Sender email (must be on a domain verified in Resend)')}</Label>
          <Input dir="ltr" value={fromAddress} onChange={e => setFromAddress(e.target.value)} placeholder="notifications@yourdomain.com" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4 ml-2" />
          {saving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ إعدادات البريد', 'Save email settings')}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loggingout, setLoggingOut] = useState(false);
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.push("/admin");
  };

  return (
    <div className="space-y-6 max-w-lg" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{bi('الإعدادات', 'Settings')}</h1>
        <p className="text-muted-foreground text-sm">{bi('إعدادات لوحة الإدارة', 'Admin panel settings')}</p>
      </div>

      <EmailSettingsCard />

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />{bi('معلومات الجلسة', 'Session Information')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground text-sm">{bi('اسم المستخدم', 'Username')}</span>
            <span className="text-foreground text-sm font-mono">admin</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground text-sm">{bi('الصلاحية', 'Role')}</span>
            <span className="text-emerald-400 text-sm">{bi('مشرف عام', 'Super admin')}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-base flex items-center gap-2"><Info className="h-4 w-4 text-blue-400" />{bi('معلومات المنصة', 'Platform Information')}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground p-2">
            <span>{bi('المنصة', 'Platform')}</span><span className="text-foreground">EmpowerHub</span>
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
        {loggingout ? bi("جاري الخروج...", "Logging out...") : bi("تسجيل الخروج", "Log out")}
      </Button>
    </div>
  );
}
