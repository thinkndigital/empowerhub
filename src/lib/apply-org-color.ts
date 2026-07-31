export function applyOrgColor(hex: string) {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return;
  let r = parseInt(h.slice(0, 2), 16) / 255;
  let g = parseInt(h.slice(2, 4), 16) / 255;
  let b = parseInt(h.slice(4, 6), 16) / 255;
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
  const Hv = Math.round(H), Sv = Math.round(S * 100), Lv = Math.round(L * 100);
  document.documentElement.style.setProperty('--primary', `${Hv} ${Sv}% ${Lv}%`);
  document.documentElement.style.setProperty('--ring', `${Hv} ${Sv}% ${Lv}%`);
  // Sidebar active items need higher lightness to be readable on the dark navy background
  const sL = Math.max(62, Math.min(76, Lv + 15));
  const sS = Math.min(90, Sv + 8);
  document.documentElement.style.setProperty('--sidebar-primary', `${Hv} ${sS}% ${sL}%`);
  document.documentElement.style.setProperty('--sidebar-ring', `${Hv} ${sS}% ${sL}%`);
}
