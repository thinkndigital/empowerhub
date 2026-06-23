"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Move, Image as ImageIcon, Layers, RotateCcw } from "lucide-react";

const FORMATS = [
  { id: 'instagram-square',  name: 'إنستقرام مربع',    w: 1080, h: 1080 },
  { id: 'instagram-story',   name: 'ستوري إنستقرام',   w: 1080, h: 1920 },
  { id: 'facebook-post',     name: 'فيسبوك منشور',     w: 1200, h: 628  },
  { id: 'twitter-post',      name: 'تويتر / إكس',      w: 1600, h: 900  },
  { id: 'linkedin-post',     name: 'لينكدإن',           w: 1200, h: 627  },
  { id: 'whatsapp-status',   name: 'واتساب ستاتوس',    w: 1080, h: 1920 },
];

// Logo preview size as fraction of preview width
const LOGO_PREVIEW_FRAC = 0.16;
// Logo export size as fraction of export width
const LOGO_EXPORT_FRAC  = 0.16;

const PREVIEW_W = 360;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => { img.crossOrigin = ''; img.onload = () => res(img); img.onerror = rej; img.src = src; };
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const iA = img.width / img.height;
  const fA = W / H;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (iA > fA) { sw = img.height * fA; sx = (img.width - sw) / 2; }
  else          { sh = img.width / fA;  sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
}

export default function ContentPage() {
  const { user: authUser, userProfile } = useUser();
  const { toast } = useToast();

  // Branding (logo data URL + phone text)
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [phone, setPhone] = useState('');

  // Background image
  const [bgImage, setBgImage] = useState('');

  // Element positions as percentages
  const [logoPos,  setLogoPos]  = useState({ x: 3, y: 3   });
  const [phonePos, setPhonePos] = useState({ x: 3, y: 84  });

  // Dragging
  const [dragging, setDragging] = useState<'logo' | 'phone' | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPx: number; startPy: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState(FORMATS[0].id);
  const selectedFormat = FORMATS.find(f => f.id === selectedFormatId)!;
  const previewH = Math.round(PREVIEW_W * selectedFormat.h / selectedFormat.w);

  // Load saved values from localStorage; fallback to userProfile
  useEffect(() => {
    const sp = localStorage.getItem('cc-phone');
    const sl = localStorage.getItem('cc-logo');
    if (sp) setPhone(sp);
    if (sl) setLogoDataUrl(sl);
  }, []);

  useEffect(() => {
    const p = userProfile as any;
    if (!phone && p?.phone) setPhone(p.phone);
    if (!logoDataUrl && p?.avatarUrl) {
      // Don't save external URLs to localStorage — just use them in session
      setLogoDataUrl(p.avatarUrl);
    }
  }, [userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage (only data URLs, not external URLs)
  useEffect(() => { if (phone) localStorage.setItem('cc-phone', phone); }, [phone]);
  useEffect(() => {
    if (logoDataUrl && logoDataUrl.startsWith('data:')) localStorage.setItem('cc-logo', logoDataUrl);
  }, [logoDataUrl]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBgImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // --- Drag handlers ---
  const startDrag = (e: React.MouseEvent, what: 'logo' | 'phone') => {
    e.preventDefault();
    const pos = what === 'logo' ? logoPos : phonePos;
    setDragging(what);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPx: pos.x, startPy: pos.y };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !dragRef.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width  * 100;
    const dy = (e.clientY - dragRef.current.startY) / rect.height * 100;
    const nx = Math.max(0, Math.min(85, dragRef.current.startPx + dx));
    const ny = Math.max(0, Math.min(92, dragRef.current.startPy + dy));
    if (dragging === 'logo')  setLogoPos({ x: nx, y: ny });
    else                      setPhonePos({ x: nx, y: ny });
  }, [dragging]);

  const stopDrag = useCallback(() => { setDragging(null); dragRef.current = null; }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', stopDrag); };
  }, [dragging, onMouseMove, stopDrag]);

  // Touch support
  const startTouchDrag = (e: React.TouchEvent, what: 'logo' | 'phone') => {
    const touch = e.touches[0];
    const pos = what === 'logo' ? logoPos : phonePos;
    setDragging(what);
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPx: pos.x, startPy: pos.y };
  };

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging || !dragRef.current || !previewRef.current) return;
    const touch = e.touches[0];
    const rect = previewRef.current.getBoundingClientRect();
    const dx = (touch.clientX - dragRef.current.startX) / rect.width  * 100;
    const dy = (touch.clientY - dragRef.current.startY) / rect.height * 100;
    const nx = Math.max(0, Math.min(85, dragRef.current.startPx + dx));
    const ny = Math.max(0, Math.min(92, dragRef.current.startPy + dy));
    if (dragging === 'logo')  setLogoPos({ x: nx, y: ny });
    else                      setPhonePos({ x: nx, y: ny });
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    return () => { window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', stopDrag); };
  }, [dragging, onTouchMove, stopDrag]);

  // --- Export ---
  const exportAll = async () => {
    if (!bgImage) { toast({ variant: 'destructive', title: 'ارفع صورة أولاً' }); return; }
    setExporting(true);
    try {
      const bgImg   = await loadImg(bgImage);
      const lgImg   = logoDataUrl ? await loadImg(logoDataUrl).catch(() => null) : null;

      for (const fmt of FORMATS) {
        const canvas = document.createElement('canvas');
        canvas.width  = fmt.w;
        canvas.height = fmt.h;
        const ctx = canvas.getContext('2d')!;

        // Background (cover)
        drawCover(ctx, bgImg, fmt.w, fmt.h);

        // Logo
        if (lgImg) {
          const lw = fmt.w * LOGO_EXPORT_FRAC;
          const lh = lw * lgImg.height / lgImg.width;
          const lx = logoPos.x / 100 * fmt.w;
          const ly = logoPos.y / 100 * fmt.h;
          ctx.drawImage(lgImg, lx, ly, lw, lh);
        }

        // Phone text
        if (phone.trim()) {
          const fontSize = Math.round(fmt.h / 24);
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'start';
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 10;
          ctx.fillStyle = 'white';
          const tx = phonePos.x / 100 * fmt.w;
          const ty = phonePos.y / 100 * fmt.h;
          ctx.fillText(phone, tx, ty);
          ctx.shadowBlur = 0;
        }

        // Download
        await new Promise<void>(resolve => {
          canvas.toBlob(blob => {
            if (!blob) { resolve(); return; }
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `${fmt.id}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 150);
          }, 'image/png');
        });

        await new Promise(r => setTimeout(r, 350));
      }

      toast({ title: `تم تصدير ${FORMATS.length} صور بنجاح!` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل التصدير', description: e.message });
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المحتوى</h1>
        <p className="text-sm text-muted-foreground mt-1">أنشئ محتوى مرئياً لجميع منصات السوشال ميديا دفعة واحدة</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* ── Left column: settings ── */}
        <div className="space-y-4">

          {/* Branding */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">الهوية البصرية — تُضبط مرة واحدة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">الشعار</Label>
                <div className="flex items-center gap-2">
                  {logoDataUrl && (
                    <img src={logoDataUrl} alt="logo" className="h-10 w-10 rounded-lg object-contain border bg-muted shrink-0" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center gap-1 text-xs text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors">
                      <Upload className="h-3.5 w-3.5" />ارفع الشعار
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                  </label>
                </div>
                {logoDataUrl && (
                  <button onClick={() => { setLogoDataUrl(''); localStorage.removeItem('cc-logo'); }}
                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                    إزالة الشعار
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">رقم الجوال / نص التواصل</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="h-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Background image upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />الصورة الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="cursor-pointer block">
                <div className={`rounded-xl border-2 border-dashed transition-colors ${bgImage ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/30'} p-6 text-center`}>
                  {bgImage ? (
                    <img src={bgImage} alt="bg" className="max-h-44 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                      <Upload className="h-9 w-9 opacity-30" />
                      <p className="text-sm font-medium">اضغط أو اسحب صورة هنا</p>
                      <p className="text-xs opacity-60">PNG · JPG · WEBP</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="sr-only" onChange={handleBgUpload} />
              </label>
              {bgImage && (
                <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs text-muted-foreground gap-1"
                  onClick={() => setBgImage('')}>
                  <RotateCcw className="h-3 w-3" />تغيير الصورة
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Format selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />أحجام السوشال ميديا
              </CardTitle>
              <p className="text-xs text-muted-foreground">اختر حجماً للمعاينة — التصدير يشمل جميع الأحجام</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FORMATS.map(fmt => (
                  <button key={fmt.id} type="button"
                    onClick={() => setSelectedFormatId(fmt.id)}
                    className={`rounded-lg border-2 px-3 py-2.5 text-right transition-all ${selectedFormatId === fmt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'}`}
                  >
                    <p className="text-xs font-semibold leading-tight">{fmt.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{fmt.w}×{fmt.h}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: preview + export ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">معاينة — {selectedFormat.name}</CardTitle>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {selectedFormat.w}×{selectedFormat.h}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Move className="h-3 w-3 shrink-0" />اسحب الشعار أو الرقم لتغيير موضعه على الصورة
              </p>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div
                ref={previewRef}
                className="relative overflow-hidden rounded-xl bg-muted/60 select-none"
                style={{ width: PREVIEW_W, height: previewH }}
              >
                {/* Background */}
                {bgImage ? (
                  <img src={bgImage} alt="bg" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 gap-2">
                    <ImageIcon className="h-14 w-14" />
                    <p className="text-xs">ارفع صورة لمعاينتها</p>
                  </div>
                )}

                {/* Logo overlay — draggable */}
                {logoDataUrl && (
                  <img
                    src={logoDataUrl}
                    alt="logo"
                    draggable={false}
                    onMouseDown={e => startDrag(e, 'logo')}
                    onTouchStart={e => startTouchDrag(e, 'logo')}
                    className={`absolute object-contain pointer-events-auto drop-shadow-lg ${dragging === 'logo' ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                      left: `${logoPos.x}%`,
                      top:  `${logoPos.y}%`,
                      width: `${LOGO_PREVIEW_FRAC * 100}%`,
                    }}
                  />
                )}

                {/* Phone text overlay — draggable */}
                {phone.trim() && (
                  <div
                    onMouseDown={e => startDrag(e, 'phone')}
                    onTouchStart={e => startTouchDrag(e, 'phone')}
                    className={`absolute text-white font-bold whitespace-nowrap pointer-events-auto ${dragging === 'phone' ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                      left: `${phonePos.x}%`,
                      top:  `${phonePos.y}%`,
                      fontSize: Math.round(PREVIEW_W / 22),
                      textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.9)',
                    }}
                  >
                    {phone}
                  </div>
                )}

                {/* Drag hint badge */}
                {bgImage && (dragging) && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
                    {dragging === 'logo' ? 'الشعار' : 'الرقم'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-medium">تصدير جميع الأحجام دفعة واحدة</p>
              <p className="text-xs text-muted-foreground">
                سيتم تنزيل <span className="font-bold text-foreground">{FORMATS.length} صور</span> بالأحجام:
                {FORMATS.map((f, i) => (
                  <span key={f.id}>{i > 0 ? ' · ' : ' '}{f.name}</span>
                ))}
              </p>
              <Button
                onClick={exportAll}
                disabled={exporting || !bgImage}
                className="w-full gap-2 h-11"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'جاري التصدير...' : `تصدير ${FORMATS.length} صور`}
              </Button>
              {!bgImage && (
                <p className="text-xs text-muted-foreground text-center">ارفع صورة أولاً لتفعيل التصدير</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
