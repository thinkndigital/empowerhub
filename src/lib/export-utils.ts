import * as XLSX from 'xlsx';

// EmpowerHub logo as inline SVG (static color for print)
const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="8" fill="#7c3aed"/>
  <path d="M11.666 11.666V28.333H15.625V21.416H24.375V28.333H28.333V11.666H24.375V18.583H15.625V11.666H11.666Z" fill="white"/>
</svg>`;

export interface ExportOptions {
  summary?: Record<string, string>;
  orgName?: string;
  orgLogoUrl?: string;
  sheetName?: string;
}

/**
 * CSV export that Excel opens correctly with Arabic support (UTF-8 BOM)
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const BOM = '﻿';
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Excel (.xlsx) export using SheetJS
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  options?: ExportOptions
): void {
  const sheetName = options?.sheetName || 'البيانات';
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-width columns
  const colWidths = headers.map((h, i) => ({
    wch: Math.max(
      h.length + 4,
      ...rows.map(r => String(r[i] ?? '').length + 2)
    )
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * PDF via browser print: injects styled print-only HTML with logo
 */
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  options?: ExportOptions
): void {
  const { summary, orgName, orgLogoUrl } = options || {};
  const printId = '__pdf_print__';
  document.getElementById(printId)?.remove();

  const logoHtml = orgLogoUrl
    ? `<img src="${orgLogoUrl}" style="height:40px;width:auto;object-fit:contain;" alt="شعار" />`
    : LOGO_SVG;

  const div = document.createElement('div');
  div.id = printId;
  div.innerHTML = `
    <style>
      @media print {
        body > *:not(#${printId}) { display: none !important; }
        #${printId} {
          display: block !important;
          direction: rtl;
          font-family: 'Arial', 'Tahoma', sans-serif;
          padding: 20px 28px;
          color: #111;
        }
        #${printId} .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #7c3aed;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        #${printId} .header-left { display: flex; align-items: center; gap: 10px; }
        #${printId} .header-left h1 { font-size: 17px; font-weight: 700; margin: 0; color: #111; }
        #${printId} .header-right { text-align: left; font-size: 10px; color: #666; }
        #${printId} .org-name { font-size: 12px; font-weight: 600; color: #7c3aed; margin-top: 2px; }
        #${printId} .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }
        #${printId} .summary-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px 10px;
          background: #f9fafb;
        }
        #${printId} .summary-item strong { display: block; font-size: 9px; color: #6b7280; margin-bottom: 3px; }
        #${printId} .summary-item span { font-size: 14px; font-weight: 700; color: #111; }
        #${printId} table { width: 100%; border-collapse: collapse; font-size: 11px; }
        #${printId} th {
          background: #7c3aed;
          color: white;
          padding: 7px 9px;
          text-align: right;
          font-weight: 600;
          font-size: 10.5px;
        }
        #${printId} td {
          border: 1px solid #e5e7eb;
          padding: 6px 9px;
          text-align: right;
          color: #374151;
        }
        #${printId} tr:nth-child(even) td { background: #f9fafb; }
        #${printId} .footer {
          margin-top: 16px;
          font-size: 9px;
          color: #9ca3af;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
        }
        @page { margin: 15mm; size: A4 landscape; }
      }
      @media screen { #${printId} { display: none; } }
    </style>
    <div class="header">
      <div class="header-left">
        ${logoHtml}
        <div>
          <h1>${title}</h1>
          ${orgName ? `<div class="org-name">${orgName}</div>` : ''}
        </div>
      </div>
      <div class="header-right">
        <div>تاريخ الطباعة</div>
        <div style="font-weight:600;color:#111;">${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div style="margin-top:3px;">إجمالي السجلات: ${rows.length}</div>
      </div>
    </div>
    ${summary ? `<div class="summary">${Object.entries(summary).map(([k, v]) => `<div class="summary-item"><strong>${k}</strong><span>${v}</span></div>`).join('')}</div>` : ''}
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="footer">EmpowerHub · تم التصدير بواسطة منصة إمباور هب · empowerhub.thinkndigital.com</div>
  `;
  document.body.appendChild(div);
  window.print();
  setTimeout(() => div.remove(), 1500);
}
