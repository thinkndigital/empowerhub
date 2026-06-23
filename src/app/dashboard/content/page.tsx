'use client';

import { useState, useRef, useEffect, useCallback, type ChangeEvent, type MouseEvent as RMouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, ImageIcon, Type, Layers, Move, RefreshCw } from 'lucide-react';

// ─── أحجام السوشال ميديا ───────────────────────────────────────
const SIZES = [
  { id: 'fb-post',    label: 'Facebook Post',      w: 1200, h: 630 },
  { id: 'ig-square',  label: 'Instagram مربع',      w: 1080, h: 1080 },
  { id: 'ig-portrait',label: 'Instagram بورتريه',   w: 1080, h: 1350 },
  { id: 'story',      label: 'Story (IG / FB)',     w: 1080, h: 1920 },
  { id: 'tw',         label: 'X (Twitter)',         w: 1200, h: 675 },
  { id: 'linkedin',   label: 'LinkedIn',            w: 1200, h: 627 },
  { id: 'youtube',    label: 'YouTube Thumbnail',   w: 1280, h: 720 },
  { id: 'whatsapp',   label: 'WhatsApp Status',     w: 1080, h: 1920 },
  { id: 'snap',       label: 'Snapchat / TikTok',   w: 1080, h: 1920 },
  { id: 'pinterest',  label: 'Pinterest',           w: 1000, h: 1500 },
];

const EDITOR_W = 540; // عرض محرر المعاينة بالبكسل

// ─── نوع عناصر المحرر ──────────────────────────────────────────
interface Pos { x: number; y: number } // نسبة 0-1 من أبعاد اللوحة

interface TextEl {
  text: string;
  pos: Pos;
  fontSize: number;  // نسبة من عرض الصورة 0-1
  color: string;
  bold: boolean;
}

interface LogoEl {
  pos: Pos;
  size: number; // نسبة من عرض الصورة 0-1
}

type DragTarget = 'text' | 'logo' | null;

// ─── رسم اللوحة ────────────────────────────────────────────────
function drawCanvas(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  bg: HTMLImageElement | null,
  logo: HTMLImageElement | null,
  logoEl: LogoEl,
  textEl: TextEl,
  bgColor: string,
) {
  ctx.clearRect(0, 0, cw, ch);

  // خلفية
  if (bg) {
    const scale = Math.max(cw / bg.width, ch / bg.height);
    const sw = bg.width * scale;
    const sh = bg.height * scale;
    ctx.drawImage(bg, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
  }

  // شعار
  if (logo) {
    const lw = cw * logoEl.size;
    const lh = lw * (logo.height / logo.width);
    const lx = cw * logoEl.pos.x - lw / 2;
    const ly = ch * logoEl.pos.y - lh / 2;
    ctx.drawImage(logo, lx, ly, lw, lh);
  }

  // نص
  if (textEl.text) {
    const fs = cw * textEl.fontSize;
    ctx.font = `${textEl.bold ? 'bold' : 'normal'} ${fs}px Cairo, Arial`;
    ctx.fillStyle = textEl.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = fs * 0.15;
    ctx.fillText(textEl.text, cw * textEl.pos.x, ch * textEl.pos.y);
    ctx.shadowBlur = 0;
  }
}

// ─── الصفحة ────────────────────────────────────────────────────
export default function ContentPage() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // صور
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [bgColor, setBgColor] = useState('#1a1a2e');

  // عناصر
  const [textEl, setTextEl] = useState<TextEl>({
    text: '',
    pos: { x: 0.5, y: 0.8 },
    fontSize: 0.06,
    color: '#ffffff',
    bold: true,
  });
  const [logoEl, setLogoEl] = useState<LogoEl>({
    pos: { x: 0.5, y: 0.15 },
    size: 0.2,
  });

  // أبعاد اللوحة (تتبع نسبة الصورة)
  const [editorH, setEditorH] = useState(EDITOR_W);

  // سحب
  const drag = useRef<{ target: DragTarget; ox: number; oy: number } | null>(null);

  // ─── تحديث أبعاد اللوحة عند تغيير الصورة ──────────────────
  useEffect(() => {
    if (bgImg) setEditorH(Math.round(EDITOR_W * bgImg.height / bgImg.width));
    else setEditorH(EDITOR_W);
  }, [bgImg]);

  // ─── إعادة الرسم عند أي تغيير ──────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCanvas(ctx, EDITOR_W, editorH, bgImg, logoImg, logoEl, textEl, bgColor);
  }, [bgImg, logoImg, logoEl, textEl, bgColor, editorH]);

  useEffect(() => { redraw(); }, [redraw]);

  // ─── رفع صورة خلفية ────────────────────────────────────────
  const onBgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setBgImg(img);
    img.src = url;
  };

  // ─── رفع شعار ───────────────────────────────────────────────
  const onLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setLogoImg(img);
    img.src = url;
  };

  // ─── سحب داخل اللوحة ───────────────────────────────────────
  const getCanvasPos = (e: RMouseEvent<HTMLCanvasElement>): Pos => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / EDITOR_W,
      y: (e.clientY - rect.top) / editorH,
    };
  };

  const hitLogo = (p: Pos): boolean => {
    if (!logoImg) return false;
    const hw = logoEl.size / 2;
    const hh = hw * (logoImg.height / logoImg.width);
    return Math.abs(p.x - logoEl.pos.x) < hw && Math.abs(p.y - logoEl.pos.y) < hh;
  };

  const hitText = (p: Pos): boolean => {
    if (!textEl.text) return false;
    const hw = textEl.fontSize * 4;
    const hh = textEl.fontSize * 0.8;
    return Math.abs(p.x - textEl.pos.x) < hw && Math.abs(p.y - textEl.pos.y) < hh;
  };

  const onMouseDown = (e: RMouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPos(e);
    let target: DragTarget = null;
    if (hitLogo(p)) target = 'logo';
    else if (hitText(p)) target = 'text';
    if (target) drag.current = { target, ox: p.x, oy: p.y };
  };

  const onMouseMove = (e: RMouseEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const p = getCanvasPos(e);
    const { target } = drag.current;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    if (target === 'logo') {
      setLogoEl(prev => ({ ...prev, pos: { x: clamp(p.x), y: clamp(p.y) } }));
    } else if (target === 'text') {
      setTextEl(prev => ({ ...prev, pos: { x: clamp(p.x), y: clamp(p.y) } }));
    }
  };

  const onMouseUp = () => { drag.current = null; };

  // ─── تصدير كل الأحجام ───────────────────────────────────────
  const exportAll = async () => {
    if (!bgImg && !logoImg && !textEl.text) {
      toast({ variant: 'destructive', title: 'لا يوجد محتوى', description: 'أضف صورة أو شعار أو نص أولاً.' });
      return;
    }
    toast({ title: 'جاري التصدير...', description: `${SIZES.length} صورة` });

    for (let i = 0; i < SIZES.length; i++) {
      const s = SIZES[i];
      const canvas = document.createElement('canvas');
      canvas.width = s.w;
      canvas.height = s.h;
      const ctx = canvas.getContext('2d')!;
      drawCanvas(ctx, s.w, s.h, bgImg, logoImg, logoEl, textEl, bgColor);
      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `empowerhub_${s.id}_${s.w}x${s.h}.png`;
          a.click();
          setTimeout(resolve, 300);
        }, 'image/png');
      });
    }

    toast({ title: 'تم التصدير!', description: 'تم تحميل جميع الأحجام.' });
  };

  const exportOne = (s: typeof SIZES[0]) => {
    const canvas = document.createElement('canvas');
    canvas.width = s.w;
    canvas.height = s.h;
    const ctx = canvas.getContext('2d')!;
    drawCanvas(ctx, s.w, s.h, bgImg, logoImg, logoEl, textEl, bgColor);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `empowerhub_${s.id}_${s.w}x${s.h}.png`;
      a.click();
    }, 'image/png');
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          محتوى السوشال ميديا
        </h1>
        <p className="text-muted-foreground mt-1">
          أضف صورتك وشعارك ونصك — صدّر لجميع المنصات دفعة واحدة
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── لوحة الأدوات ── */}
        <div className="space-y-4 lg:col-span-1">

          {/* رفع صورة خلفية */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> الصورة الخلفية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="bg-upload" className="cursor-pointer block">
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {bgImg ? 'تم الرفع ✓' : 'انقر لرفع صورة'}
                  </span>
                </div>
                <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={onBgUpload} />
              </Label>
              {!bgImg && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">أو لون</Label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="h-8 w-full rounded cursor-pointer border border-input"
                  />
                </div>
              )}
              {bgImg && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setBgImg(null)}>
                  <RefreshCw className="h-3 w-3 ml-1" /> إزالة الصورة
                </Button>
              )}
            </CardContent>
          </Card>

          {/* رفع الشعار */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> الشعار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="logo-upload" className="cursor-pointer block">
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {logoImg ? 'تم الرفع ✓' : 'ارفع الشعار (PNG شفاف)'}
                  </span>
                </div>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
              </Label>
              {logoImg && (
                <>
                  <div>
                    <Label className="text-xs mb-1 block">حجم الشعار ({Math.round(logoEl.size * 100)}%)</Label>
                    <Slider
                      min={5} max={60} step={1}
                      value={[Math.round(logoEl.size * 100)]}
                      onValueChange={([v]) => setLogoEl(prev => ({ ...prev, size: v / 100 }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Move className="h-3 w-3" /> اسحب الشعار على اللوحة لتحريكه
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* النص */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" /> النص
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">النص أو الرقم</Label>
                <Input
                  value={textEl.text}
                  onChange={e => setTextEl(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="مثال: 0501234567"
                  className="text-right"
                />
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">حجم الخط ({Math.round(textEl.fontSize * 100)}%)</Label>
                  <Slider
                    min={2} max={15} step={0.5}
                    value={[Math.round(textEl.fontSize * 100)]}
                    onValueChange={([v]) => setTextEl(prev => ({ ...prev, fontSize: v / 100 }))}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">اللون</Label>
                  <input
                    type="color"
                    value={textEl.color}
                    onChange={e => setTextEl(prev => ({ ...prev, color: e.target.value }))}
                    className="h-9 w-12 rounded cursor-pointer border border-input"
                  />
                </div>
              </div>
              <Button
                variant="outline" size="sm"
                className={`w-full text-xs ${textEl.bold ? 'bg-primary/10 border-primary' : ''}`}
                onClick={() => setTextEl(prev => ({ ...prev, bold: !prev.bold }))}
              >
                {textEl.bold ? 'خط عريض ✓' : 'خط عريض'}
              </Button>
              {textEl.text && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Move className="h-3 w-3" /> اسحب النص على اللوحة لتحريكه
                </p>
              )}
            </CardContent>
          </Card>

          {/* تصدير */}
          <Button className="w-full gap-2 shadow-md" onClick={exportAll} size="lg">
            <Download className="h-5 w-5" />
            تصدير كل الأحجام ({SIZES.length} صورة)
          </Button>
        </div>

        {/* ── اللوحة والمعاينات ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* محرر المعاينة */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">المحرر — اسحب العناصر لتحريكها</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-2" ref={containerRef}>
              <canvas
                ref={canvasRef}
                width={EDITOR_W}
                height={editorH}
                className="rounded-lg border border-border cursor-move max-w-full"
                style={{ display: 'block' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
            </CardContent>
          </Card>

          {/* شبكة معاينة الأحجام */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">معاينة الأحجام — انقر لتحميل مقاس واحد</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SIZES.map(s => (
                <button
                  key={s.id}
                  onClick={() => exportOne(s)}
                  className="group relative border border-border rounded-lg p-2 hover:border-primary hover:bg-primary/5 transition-all text-right"
                >
                  {/* معاينة مصغرة */}
                  <SizePreview
                    width={s.w} height={s.h}
                    bgImg={bgImg} logoImg={logoImg}
                    logoEl={logoEl} textEl={textEl} bgColor={bgColor}
                  />
                  <p className="text-xs font-medium mt-1 truncate">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.w}×{s.h}</p>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 rounded-lg">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── مكوّن معاينة صغيرة لكل حجم ────────────────────────────────
function SizePreview({
  width, height,
  bgImg, logoImg, logoEl, textEl, bgColor,
}: {
  width: number; height: number;
  bgImg: HTMLImageElement | null; logoImg: HTMLImageElement | null;
  logoEl: LogoEl; textEl: TextEl; bgColor: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const PREV = 120; // عرض المعاينة الصغيرة
  const ph = Math.round(PREV * height / width);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCanvas(ctx, PREV, ph, bgImg, logoImg, logoEl, textEl, bgColor);
  }, [bgImg, logoImg, logoEl, textEl, bgColor, ph]);

  return (
    <canvas
      ref={ref}
      width={PREV} height={ph}
      className="w-full rounded border border-border/50"
    />
  );
}
