"use client";

import { useEffect, useState } from 'react';

const SYMBOLS: Record<string, string> = {
  JOD: 'د.أ', SAR: 'ر.س', USD: '$', EUR: '€', GBP: '£',
  AED: 'د.إ', KWD: 'د.ك', BHD: 'د.ب', QAR: 'ر.ق', EGP: 'ج.م',
};

type CurrencyState = { code: string; symbol: string };

let _cached: CurrencyState | null = null;
let _promise: Promise<void> | null = null;

export function useCurrency(): CurrencyState {
  const [state, setState] = useState<CurrencyState>(_cached || { code: 'JOD', symbol: 'د.أ' });

  useEffect(() => {
    if (_cached) { setState(_cached); return; }
    if (!_promise) {
      _promise = fetch('/api/public/payment-config')
        .then(r => r.json())
        .then(d => {
          const code = d.config?.currency || 'JOD';
          _cached = { code, symbol: SYMBOLS[code] || code };
        })
        .catch(() => { _cached = { code: 'JOD', symbol: 'د.أ' }; });
    }
    _promise.then(() => { if (_cached) setState(_cached); });
  }, []);

  return state;
}
