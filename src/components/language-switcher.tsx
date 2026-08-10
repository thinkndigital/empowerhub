"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 p-2 rounded-lg text-foreground hover:bg-muted/60 transition-colors outline-none"
        aria-label="Language / اللغة"
      >
        <Globe className="h-[18px] w-[18px]" />
        <span className="text-xs font-semibold hidden sm:inline">{lang === "ar" ? "EN" : "AR"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onSelect={() => setLang("ar")} className={lang === "ar" ? "font-semibold" : ""}>
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLang("en")} className={lang === "en" ? "font-semibold" : ""}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
