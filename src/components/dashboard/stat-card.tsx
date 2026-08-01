import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatCardTrend {
  value: string;
  direction: "up" | "down";
}

export interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  trend?: StatCardTrend;
  loading?: boolean;
  /** Marks this cell as the currently-highlighted metric with a leading accent bar. */
  active?: boolean;
  className?: string;
}

/**
 * A single flat stat cell — no border/shadow of its own. Meant to be used
 * inside <StatGrid>, which supplies the shared border and dividers.
 */
export function StatCard({ title, value, description, icon: Icon, trend, loading, active, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative p-5",
        active && "before:absolute before:inset-y-0 before:start-0 before:w-0.5 before:bg-primary",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />}
      </div>

      {loading ? (
        <Skeleton className="mt-2.5 h-7 w-16" />
      ) : (
        <div className="mt-1 text-xl font-bold tracking-tight text-foreground tabular-nums">{value}</div>
      )}

      {(description || trend) && !loading && (
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.direction === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
      )}
    </div>
  );
}

/** Wraps a set of <StatCard> cells in a single bordered surface with dividers between them. */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-4 sm:divide-y-0 sm:[&>*:nth-child(n+5)]:border-t sm:divide-x sm:divide-border rtl:sm:divide-x-reverse",
        className
      )}
    >
      {children}
    </div>
  );
}
