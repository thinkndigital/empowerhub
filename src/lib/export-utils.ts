// Export utilities for financial reports

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
 * PDF via print: injects a hidden print-only table into the DOM, triggers print, removes it
 */
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  summary?: Record<string, string>
): void {
  const printId = '__pdf_print__';
  const existing = document.getElementById(printId);
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = printId;
  div.innerHTML = `
    <style>
      @media print {
        body > *:not(#${printId}) { display: none !important; }
        #${printId} { display: block !important; direction: rtl; font-family: Arial, sans-serif; padding: 20px; }
        #${printId} h1 { font-size: 18px; margin-bottom: 12px; }
        #${printId} p { font-size: 11px; color: #666; margin-bottom: 12px; }
        #${printId} table { width: 100%; border-collapse: collapse; font-size: 11px; }
        #${printId} th, #${printId} td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
        #${printId} th { background: #f5f5f5; font-weight: bold; }
        #${printId} .summary { margin-top: 16px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        #${printId} .summary-item { border: 1px solid #ccc; padding: 8px; border-radius: 4px; }
        #${printId} .summary-item strong { display: block; font-size: 9px; color: #666; margin-bottom: 4px; }
      }
      @media screen { #${printId} { display: none; } }
    </style>
    <h1>${title}</h1>
    <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
    ${summary ? `<div class="summary">${Object.entries(summary).map(([k, v]) => `<div class="summary-item"><strong>${k}</strong>${v}</div>`).join('')}</div>` : ''}
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
  document.body.appendChild(div);
  window.print();
  setTimeout(() => div.remove(), 1000);
}
