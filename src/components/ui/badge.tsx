import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/25",
        outline:
          "text-foreground border-border",
        /* ── semantic status variants ── */
        active:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40",
        pending:
          "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
        completed:
          "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40",
        new:
          "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40",
        inactive:
          "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/40",
        cancelled:
          "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-800/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
