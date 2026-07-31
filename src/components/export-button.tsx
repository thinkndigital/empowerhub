"use client";

import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToPDF, type ExportOptions } from "@/lib/export-utils";

interface ExportButtonProps {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  options?: ExportOptions;
  disabled?: boolean;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

export function ExportButton({
  title,
  filename,
  headers,
  rows,
  options,
  disabled,
  size = "sm",
  variant = "outline",
  className,
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || rows.length === 0} className={className}>
          <Download className="h-4 w-4 ml-1.5" />
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" style={{ direction: 'rtl' }}>
        <DropdownMenuItem
          onClick={() => exportToExcel(filename, headers, rows, options)}
          className="gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          تصدير Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToPDF(title, headers, rows, options)}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-red-500" />
          تصدير PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
