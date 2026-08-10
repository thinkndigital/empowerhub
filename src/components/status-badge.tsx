"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

type StatusKey =
  | "active" | "نشط"
  | "pending" | "معلق" | "قيد الانتظار" | "pending_payment"
  | "completed" | "مكتمل" | "منشورة" | "published"
  | "new" | "جديد"
  | "inactive" | "غير نشط" | "موقوف"
  | "cancelled" | "ملغي" | "ملغى"
  | "draft" | "مسودة"
  | "paid" | "مدفوع"
  | "processing" | "قيد المعالجة"
  | string;

const statusMap: Record<string, {
  label: string;
  labelEn: string;
  variant: "active" | "pending" | "completed" | "new" | "inactive" | "cancelled";
}> = {
  // Active states
  active:       { label: "نشط",            labelEn: "Active",    variant: "active" },
  "نشط":        { label: "نشط",            labelEn: "Active",    variant: "active" },
  published:    { label: "منشور",          labelEn: "Published", variant: "active" },
  "منشورة":     { label: "منشور",          labelEn: "Published", variant: "active" },
  paid:         { label: "مدفوع",          labelEn: "Paid",      variant: "active" },
  "مدفوع":      { label: "مدفوع",          labelEn: "Paid",      variant: "active" },

  // Pending states
  pending:         { label: "معلق",         labelEn: "Pending",         variant: "pending" },
  "معلق":          { label: "معلق",         labelEn: "Pending",         variant: "pending" },
  "قيد الانتظار":  { label: "قيد الانتظار", labelEn: "Pending",         variant: "pending" },
  pending_payment: { label: "بانتظار الدفع", labelEn: "Awaiting payment", variant: "pending" },
  processing:      { label: "قيد المعالجة", labelEn: "Processing",      variant: "pending" },
  "قيد المعالجة":  { label: "قيد المعالجة", labelEn: "Processing",      variant: "pending" },

  // Completed states
  completed:  { label: "مكتمل",  labelEn: "Completed", variant: "completed" },
  "مكتمل":    { label: "مكتمل",  labelEn: "Completed", variant: "completed" },
  delivered:  { label: "مُسلَّم", labelEn: "Delivered", variant: "completed" },

  // New states
  new:    { label: "جديد",  labelEn: "New",   variant: "new" },
  "جديد": { label: "جديد",  labelEn: "New",   variant: "new" },
  draft:  { label: "مسودة", labelEn: "Draft", variant: "new" },
  "مسودة":{ label: "مسودة", labelEn: "Draft", variant: "new" },

  // Inactive states
  inactive:  { label: "غير نشط", labelEn: "Inactive", variant: "inactive" },
  "غير نشط": { label: "غير نشط", labelEn: "Inactive", variant: "inactive" },
  "موقوف":   { label: "موقوف",   labelEn: "Suspended", variant: "inactive" },

  // Cancelled states
  cancelled: { label: "ملغي",  labelEn: "Cancelled", variant: "cancelled" },
  "ملغي":    { label: "ملغي",  labelEn: "Cancelled", variant: "cancelled" },
  "ملغى":    { label: "ملغى",  labelEn: "Cancelled", variant: "cancelled" },
  refunded:  { label: "مسترد", labelEn: "Refunded",  variant: "cancelled" },
};

interface StatusBadgeProps {
  status: StatusKey;
  className?: string;
  showDot?: boolean;
}

const dotColors = {
  active:    "bg-emerald-500",
  pending:   "bg-amber-500",
  completed: "bg-blue-500",
  new:       "bg-purple-500",
  inactive:  "bg-slate-400",
  cancelled: "bg-red-500",
};

export function StatusBadge({ status, className, showDot = false }: StatusBadgeProps) {
  const { lang } = useLanguage();
  const mapped = statusMap[status] ?? { label: status, labelEn: status, variant: "inactive" as const };

  return (
    <Badge
      variant={mapped.variant as any}
      className={cn("gap-1.5", className)}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[mapped.variant])}
        />
      )}
      {lang === 'en' ? mapped.labelEn : mapped.label}
    </Badge>
  );
}
