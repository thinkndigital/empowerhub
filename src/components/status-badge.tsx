"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  variant: "active" | "pending" | "completed" | "new" | "inactive" | "cancelled";
}> = {
  // Active states
  active:       { label: "نشط",            variant: "active" },
  "نشط":        { label: "نشط",            variant: "active" },
  published:    { label: "منشور",          variant: "active" },
  "منشورة":     { label: "منشور",          variant: "active" },
  paid:         { label: "مدفوع",          variant: "active" },
  "مدفوع":      { label: "مدفوع",          variant: "active" },

  // Pending states
  pending:         { label: "معلق",         variant: "pending" },
  "معلق":          { label: "معلق",         variant: "pending" },
  "قيد الانتظار":  { label: "قيد الانتظار", variant: "pending" },
  pending_payment: { label: "بانتظار الدفع", variant: "pending" },
  processing:      { label: "قيد المعالجة", variant: "pending" },
  "قيد المعالجة":  { label: "قيد المعالجة", variant: "pending" },

  // Completed states
  completed:  { label: "مكتمل",  variant: "completed" },
  "مكتمل":    { label: "مكتمل",  variant: "completed" },
  delivered:  { label: "مُسلَّم", variant: "completed" },

  // New states
  new:    { label: "جديد",  variant: "new" },
  "جديد": { label: "جديد",  variant: "new" },
  draft:  { label: "مسودة", variant: "new" },
  "مسودة":{ label: "مسودة", variant: "new" },

  // Inactive states
  inactive:  { label: "غير نشط", variant: "inactive" },
  "غير نشط": { label: "غير نشط", variant: "inactive" },
  "موقوف":   { label: "موقوف",   variant: "inactive" },

  // Cancelled states
  cancelled: { label: "ملغي",  variant: "cancelled" },
  "ملغي":    { label: "ملغي",  variant: "cancelled" },
  "ملغى":    { label: "ملغى",  variant: "cancelled" },
  refunded:  { label: "مسترد", variant: "cancelled" },
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
  const mapped = statusMap[status] ?? { label: status, variant: "inactive" as const };

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
      {mapped.label}
    </Badge>
  );
}
