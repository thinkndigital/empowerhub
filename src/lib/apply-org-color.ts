export function hexToHslParts(hex: string): { h: number; s: number; l: number } | null {
  const clean = hex.replace(/^#/, '');
  if (clean.length !== 6) return null;
  let r = parseInt(clean.slice(0, 2), 16) / 255;
  let g = parseInt(clean.slice(2, 4), 16) / 255;
  let b = parseInt(clean.slice(4, 6), 16) / 255;
  const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let H = 0, S = 0;
  const L = (cmax + cmin) / 2;
  if (delta !== 0) {
    S = L > 0.5 ? delta / (2 - cmax - cmin) : delta / (cmax + cmin);
    if (cmax === r) H = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    else if (cmax === g) H = ((b - r) / delta + 2) * 60;
    else H = ((r - g) / delta + 4) * 60;
  }
  if (H < 0) H += 360;
  return { h: Math.round(H), s: Math.round(S * 100), l: Math.round(L * 100) };
}

export function applyOrgColor(hex: string, extra?: { secondary?: string; hover?: string }) {
  const hsl = hexToHslParts(hex);
  if (!hsl) return;
  const { h: Hv, s: Sv, l: Lv } = hsl;
  document.documentElement.style.setProperty('--primary', `${Hv} ${Sv}% ${Lv}%`);
  document.documentElement.style.setProperty('--ring', `${Hv} ${Sv}% ${Lv}%`);
  // Sidebar active items need higher lightness to be readable on the dark navy background
  const sL = Math.max(62, Math.min(76, Lv + 15));
  const sS = Math.min(90, Sv + 8);
  document.documentElement.style.setProperty('--sidebar-primary', `${Hv} ${sS}% ${sL}%`);
  document.documentElement.style.setProperty('--sidebar-ring', `${Hv} ${sS}% ${sL}%`);

  if (extra?.hover) {
    const hoverHsl = hexToHslParts(extra.hover);
    if (hoverHsl) {
      document.documentElement.style.setProperty('--primary-hover', `${hoverHsl.h} ${hoverHsl.s}% ${hoverHsl.l}%`);
    }
  } else {
    // Fall back to a darkened shade of the primary color
    document.documentElement.style.setProperty('--primary-hover', `${Hv} ${Sv}% ${Math.max(0, Lv - 7)}%`);
  }

  if (extra?.secondary) {
    const secHsl = hexToHslParts(extra.secondary);
    if (secHsl) {
      const fg = secHsl.l > 60 ? '224 71% 4%' : '210 40% 95%';
      document.documentElement.style.setProperty('--secondary', `${secHsl.h} ${secHsl.s}% ${secHsl.l}%`);
      document.documentElement.style.setProperty('--secondary-foreground', fg);
    }
  }
}
