"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <Button
      variant="ghost"
      onClick={toggle}
      className={cn("h-9 w-9 rounded-xl p-0 hover:bg-muted/60 shrink-0", className)}
      aria-label="تبديل المظهر"
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="h-[18px] w-[18px] transition-transform duration-300" />
      ) : (
        <Moon className="h-[18px] w-[18px] transition-transform duration-300" />
      )}
    </Button>
  );
}
