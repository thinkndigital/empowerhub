import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          الإعدادات
        </h1>
        <p className="text-sm text-muted-foreground">
          إدارة إعدادات حسابك وتفضيلاتك هنا.
        </p>
      </div>
    </div>
  );
}
