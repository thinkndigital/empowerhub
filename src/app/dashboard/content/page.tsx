'use client';

import { useState, useRef, useEffect, useCallback, type ChangeEvent, type MouseEvent as RMouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { uploadFile } from '@/lib/upload-file';
import {
  Download, Upload, ImageIcon, Type, Layers, Move, RefreshCw,
  Video, Plus, X, Trash2, Library, Loader2,
} from 'lucide-react';

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

const LIBRARY_SIZE = SIZES[1]; // مقاس الحفظ بالمكتبة (Instagram مربع)
const EDITOR_W = 540; // عرض محرر المعاينة بالبكسل

// ─── نوع عناصر المحرر ──────────────────────────────────────────
interface Pos { x: number; y: number } // نسبة 0-1 من أبعاد اللوحة

interface TextEl {
  id: string;
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

interface SizedMedia {
  id: string;
  label: string;
  w: number;
  h: number;
  url: string;
}

interface LibraryItem {
  id: string;
  title: string;
  type: 'image' | 'video';
  mediaUrl: string;
  mediaUrls?: SizedMedia[];
  createdAt?: string;
}

type DragTarget = { kind: 'text'; id: string } | { kind: 'logo' } | null;

const newTextEl = (): TextEl => ({
  id: crypto.randomUUID(),
  text: '',
  pos: { x: 0.5, y: 0.8 },
  fontSize: 0.06,
  color: '#ffffff',
  bold: true,
});

// ─── رسم طبقة الشعار والنصوص فقط (تُستخدم للصور والفيديو) ─────
function drawOverlay(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  logo: HTMLImageElement | null,
  logoEl: LogoEl,
  textEls: TextEl[],
) {
  // شعار
  if (logo) {
    const lw = cw * logoEl.size;
    const lh = lw * (logo.height / logo.width);
    const lx = cw * logoEl.pos.x - lw / 2;
    const ly = ch * logoEl.pos.y - lh / 2;
    ctx.drawImage(logo, lx, ly, lw, lh);
  }

  // نصوص (طبقة فوق طبقة)
  for (const textEl of textEls) {
    if (!textEl.text) continue;
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

// ─── رسم اللوحة ────────────────────────────────────────────────
function drawCanvas(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  bg: HTMLImageElement | null,
  logo: HTMLImageElement | null,
  logoEl: LogoEl,
  textEls: TextEl[],
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

  drawOverlay(ctx, cw, ch, logo, logoEl, textEls);
}

// ─── دمج نص وشعار داخل الفيديو (تسجيل حي عبر Canvas) ──────────
async function bakeVideoOverlay(
  file: File,
  logoImg: HTMLImageElement | null,
  logoEl: LogoEl,
  textEls: TextEl[],
): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('المتصفح لا يدعم تحرير الفيديو');
  }

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('تعذر تحميل الفيديو'));
  });

  const cw = video.videoWidth;
  const ch = video.videoHeight;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof (canvas as any).captureStream !== 'function') {
    URL.revokeObjectURL(video.src);
    throw new Error('المتصفح لا يدعم تحرير الفيديو');
  }

  const canvasStream: MediaStream = (canvas as any).captureStream(30);

  let audioTracks: MediaStreamTrack[] = [];
  try {
    if (typeof (video as any).captureStream === 'function') {
      const videoStream: MediaStream = (video as any).captureStream();
      audioTracks = videoStream.getAudioTracks();
    }
  } catch {
    audioTracks = [];
  }

  const outStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';
  const recorder = new MediaRecorder(outStream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  let raf = 0;
  const drawFrame = () => {
    ctx.drawImage(video, 0, 0, cw, ch);
    drawOverlay(ctx, cw, ch, logoImg, logoEl, textEls);
    raf = requestAnimationFrame(drawFrame);
  };

  const ended = new Promise<void>((resolve) => { video.onended = () => resolve(); });

  recorder.start();
  await video.play();
  drawFrame();
  await ended;

  cancelAnimationFrame(raf);
  recorder.stop();
  video.pause();
  URL.revokeObjectURL(video.src);

  return recordingDone;
}

// ─── الصفحة ────────────────────────────────────────────────────
export default function ContentPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // صور
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [bgColor, setBgColor] = useState('#1a1a2e');

  // عناصر
  const [textEls, setTextEls] = useState<TextEl[]>([newTextEl()]);
  const [selectedTextId, setSelectedTextId] = useState<string>(textEls[0].id);
  const [logoEl, setLogoEl] = useState<LogoEl>({
    pos: { x: 0.5, y: 0.15 },
    size: 0.2,
  });
  const [contentTitle, setContentTitle] = useState('');

  // فيديو
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoCaption, setVideoCaption] = useState('');

  // المكتبة
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);

  // أبعاد اللوحة (تتبع نسبة الصورة)
  const [editorH, setEditorH] = useState(EDITOR_W);

  // سحب
  const drag = useRef<DragTarget>(null);

  const selectedText = textEls.find(t => t.id === selectedTextId) || null;

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
    drawCanvas(ctx, EDITOR_W, editorH, bgImg, logoImg, logoEl, textEls, bgColor);
  }, [bgImg, logoImg, logoEl, textEls, bgColor, editorH]);

  useEffect(() => { redraw(); }, [redraw]);

  // ─── جلب المكتبة ───────────────────────────────────────────
  const fetchLibrary = useCallback(async () => {
    if (!user) return;
    setLibraryLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/beneficiary/social-content', {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setLibraryItems(json.items || []);
    } catch {
      // silent
    } finally {
      setLibraryLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

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

  // ─── رفع فيديو ──────────────────────────────────────────────
  const onVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  // ─── إدارة النصوص المتعددة ──────────────────────────────────
  const addTextEl = () => {
    const el = newTextEl();
    setTextEls(prev => [...prev, el]);
    setSelectedTextId(el.id);
  };

  const removeTextEl = (id: string) => {
    setTextEls(prev => {
      const next = prev.filter(t => t.id !== id);
      if (selectedTextId === id) setSelectedTextId(next[0]?.id || '');
      return next;
    });
  };

  const updateSelectedText = (patch: Partial<TextEl>) => {
    if (!selectedTextId) return;
    setTextEls(prev => prev.map(t => (t.id === selectedTextId ? { ...t, ...patch } : t)));
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

  const hitText = (p: Pos): TextEl | null => {
    for (let i = textEls.length - 1; i >= 0; i--) {
      const t = textEls[i];
      if (!t.text) continue;
      const hw = t.fontSize * 4;
      const hh = t.fontSize * 0.8;
      if (Math.abs(p.x - t.pos.x) < hw && Math.abs(p.y - t.pos.y) < hh) return t;
    }
    return null;
  };

  const onMouseDown = (e: RMouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPos(e);
    if (hitLogo(p)) {
      drag.current = { kind: 'logo' };
      return;
    }
    const hitT = hitText(p);
    if (hitT) {
      drag.current = { kind: 'text', id: hitT.id };
      setSelectedTextId(hitT.id);
    }
  };

  const onMouseMove = (e: RMouseEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const p = getCanvasPos(e);
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const pos = { x: clamp(p.x), y: clamp(p.y) };
    if (drag.current.kind === 'logo') {
      setLogoEl(prev => ({ ...prev, pos }));
    } else {
      const id = drag.current.id;
      setTextEls(prev => prev.map(t => (t.id === id ? { ...t, pos } : t)));
    }
  };

  const onMouseUp = () => { drag.current = null; };

  // ─── تصدير كل الأحجام ───────────────────────────────────────
  const hasContent = () => !!bgImg || !!logoImg || textEls.some(t => t.text);

  const exportAll = async () => {
    if (!hasContent()) {
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
      drawCanvas(ctx, s.w, s.h, bgImg, logoImg, logoEl, textEls, bgColor);
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
    drawCanvas(ctx, s.w, s.h, bgImg, logoImg, logoEl, textEls, bgColor);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `empowerhub_${s.id}_${s.w}x${s.h}.png`;
      a.click();
    }, 'image/png');
  };

  // ─── حفظ الصورة الحالية بالمكتبة (كل الأحجام) ─────────────────
  const saveImageToLibrary = async () => {
    if (!user) return;
    if (!hasContent()) {
      toast({ variant: 'destructive', title: 'لا يوجد محتوى', description: 'أضف صورة أو شعار أو نص أولاً.' });
      return;
    }
    if (!contentTitle.trim()) {
      toast({ variant: 'destructive', title: 'اسم المنشور مطلوب', description: 'الرجاء كتابة اسم المنشور قبل الحفظ.' });
      return;
    }
    setSavingImage(true);
    try {
      const token = await user.getIdToken();
      toast({ title: 'جاري الحفظ...', description: `يتم إنشاء ${SIZES.length} مقاسات` });

      const mediaUrls: SizedMedia[] = [];
      for (const s of SIZES) {
        const canvas = document.createElement('canvas');
        canvas.width = s.w;
        canvas.height = s.h;
        const ctx = canvas.getContext('2d')!;
        drawCanvas(ctx, s.w, s.h, bgImg, logoImg, logoEl, textEls, bgColor);

        const blob: Blob = await new Promise((resolve, reject) => {
          canvas.toBlob(b => (b ? resolve(b) : reject(new Error('فشل إنشاء الصورة'))), 'image/png');
        });
        const file = new File([blob], `content-${s.id}-${Date.now()}.png`, { type: 'image/png' });
        const url = await uploadFile(file, 'social-content', token);
        mediaUrls.push({ id: s.id, label: s.label, w: s.w, h: s.h, url });
      }

      const mediaUrl = mediaUrls.find(m => m.id === LIBRARY_SIZE.id)?.url || mediaUrls[0].url;

      const res = await fetch('/api/beneficiary/social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: contentTitle, type: 'image', mediaUrl, mediaUrls }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'فشل الحفظ');

      toast({ title: 'تم الحفظ بالمكتبة', description: `تم حفظ ${SIZES.length} مقاسات.` });
      setContentTitle('');
      fetchLibrary();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل الحفظ', description: e.message });
    } finally {
      setSavingImage(false);
    }
  };

  // ─── حفظ الفيديو بالمكتبة (مع دمج النص والشعار إن وُجدا) ──────
  const saveVideoToLibrary = async () => {
    if (!user || !videoFile) return;
    if (!videoCaption.trim()) {
      toast({ variant: 'destructive', title: 'اسم المنشور مطلوب', description: 'الرجاء كتابة اسم المنشور قبل الحفظ.' });
      return;
    }
    setSavingVideo(true);
    try {
      const token = await user.getIdToken();
      const hasOverlay = !!logoImg || textEls.some(t => t.text.trim());
      let fileToUpload: File = videoFile;

      if (hasOverlay) {
        try {
          toast({ title: 'جاري دمج النص والشعار مع الفيديو...' });
          const blob = await bakeVideoOverlay(videoFile, logoImg, logoEl, textEls);
          fileToUpload = new File([blob], `content-video-${Date.now()}.webm`, { type: 'video/webm' });
        } catch {
          toast({
            variant: 'destructive',
            title: 'تعذّر دمج العناصر مع الفيديو',
            description: 'سيتم حفظ الفيديو الأصلي بدون تعديل.',
          });
        }
      }

      const mediaUrl = await uploadFile(fileToUpload, 'social-content', token);

      const res = await fetch('/api/beneficiary/social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: videoCaption, type: 'video', mediaUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'فشل الحفظ');

      toast({ title: 'تم حفظ الفيديو بالمكتبة' });
      setVideoFile(null);
      setVideoPreview(null);
      setVideoCaption('');
      fetchLibrary();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل الحفظ', description: e.message });
    } finally {
      setSavingVideo(false);
    }
  };

  // ─── حذف عنصر من المكتبة ─────────────────────────────────────
  const deleteLibraryItem = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/beneficiary/social-content?id=${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'فشل الحذف');
      setLibraryItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل الحذف', description: e.message });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          محتوى السوشال ميديا
        </h1>
        <p className="text-muted-foreground mt-1">
          أضف صورتك وشعارك ونصوصك — صدّر لجميع المنصات أو احفظ بمكتبتك
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

          {/* النصوص (متعددة) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" /> النصوص
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {textEls.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTextId(t.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      t.id === selectedTextId
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {t.text || `نص ${i + 1}`}
                    {textEls.length > 1 && (
                      <X
                        className="h-3 w-3 shrink-0"
                        onClick={e => { e.stopPropagation(); removeTextEl(t.id); }}
                      />
                    )}
                  </button>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addTextEl}>
                  <Plus className="h-3 w-3" /> نص جديد
                </Button>
              </div>

              {selectedText && (
                <>
                  <div>
                    <Label className="text-xs mb-1 block">النص أو الرقم</Label>
                    <Input
                      value={selectedText.text}
                      onChange={e => updateSelectedText({ text: e.target.value })}
                      placeholder="مثال: 0501234567"
                      className="text-right"
                    />
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <Label className="text-xs mb-1 block">حجم الخط ({Math.round(selectedText.fontSize * 100)}%)</Label>
                      <Slider
                        min={2} max={15} step={0.5}
                        value={[Math.round(selectedText.fontSize * 100)]}
                        onValueChange={([v]) => updateSelectedText({ fontSize: v / 100 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">اللون</Label>
                      <input
                        type="color"
                        value={selectedText.color}
                        onChange={e => updateSelectedText({ color: e.target.value })}
                        className="h-9 w-12 rounded cursor-pointer border border-input"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className={`w-full text-xs ${selectedText.bold ? 'bg-primary/10 border-primary' : ''}`}
                    onClick={() => updateSelectedText({ bold: !selectedText.bold })}
                  >
                    {selectedText.bold ? 'خط عريض ✓' : 'خط عريض'}
                  </Button>
                  {selectedText.text && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Move className="h-3 w-3" /> اسحب النص المحدد على اللوحة لتحريكه
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* حفظ وتصدير */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div>
                <Label className="text-xs mb-1 block">اسم المنشور *</Label>
                <Input
                  value={contentTitle}
                  onChange={e => setContentTitle(e.target.value)}
                  placeholder="مثال: عرض نهاية الأسبوع"
                  className="text-right"
                />
              </div>
              <Button className="w-full gap-2 shadow-md" onClick={exportAll} size="lg">
                <Download className="h-5 w-5" />
                تصدير كل الأحجام ({SIZES.length} صورة)
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={saveImageToLibrary} disabled={savingImage}>
                {savingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" />}
                حفظ في المكتبة (كل الأحجام)
              </Button>
            </CardContent>
          </Card>

          {/* الفيديو */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" /> فيديو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="video-upload" className="cursor-pointer block">
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {videoFile ? 'تم الرفع ✓' : 'ارفع فيديو (حتى 20 ميجابايت)'}
                  </span>
                </div>
                <input id="video-upload" type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={onVideoUpload} />
              </Label>
              {videoPreview && (
                <video src={videoPreview} controls className="w-full rounded-lg border border-border max-h-48" />
              )}
              {videoFile && (
                <>
                  <div>
                    <Label className="text-xs mb-1 block">اسم المنشور *</Label>
                    <Input
                      value={videoCaption}
                      onChange={e => setVideoCaption(e.target.value)}
                      placeholder="مثال: فيديو ترويجي"
                      className="text-right"
                    />
                  </div>
                  {(logoImg || textEls.some(t => t.text.trim())) && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <Layers className="h-3 w-3" /> سيتم دمج النص والشعار الحاليين مع الفيديو تلقائياً عند الحفظ
                    </p>
                  )}
                  <Button className="w-full gap-2" onClick={saveVideoToLibrary} disabled={savingVideo}>
                    {savingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" />}
                    حفظ الفيديو بالمكتبة
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
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
                    logoEl={logoEl} textEls={textEls} bgColor={bgColor}
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

          {/* المكتبة */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
              <Library className="h-4 w-4" /> مكتبتي ({libraryItems.length})
            </h3>
            {libraryLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : libraryItems.length === 0 ? (
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg py-10 text-center text-sm text-muted-foreground">
                لا يوجد محتوى محفوظ بعد — احفظ صورة أو فيديو لتظهر هنا
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {libraryItems.map(item => (
                  <LibraryItemCard key={item.id} item={item} onDelete={deleteLibraryItem} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── بطاقة عنصر بالمكتبة (مع أحجام قابلة للتوسيع للصور) ─────────
function LibraryItemCard({ item, onDelete }: { item: LibraryItem; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasSizes = item.type === 'image' && !!item.mediaUrls && item.mediaUrls.length > 0;

  return (
    <div className="group relative border border-border rounded-lg overflow-hidden bg-card">
      {item.type === 'image' ? (
        <img src={item.mediaUrl} alt={item.title} className="w-full aspect-square object-cover" />
      ) : (
        <video src={item.mediaUrl} className="w-full aspect-square object-cover" muted />
      )}
      <div className="p-2">
        <p className="text-xs font-medium truncate">{item.title || 'بدون عنوان'}</p>
        {hasSizes && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-[10px] text-primary hover:underline mt-0.5"
          >
            {expanded ? 'إخفاء الأحجام' : `كل الأحجام (${item.mediaUrls!.length})`}
          </button>
        )}
      </div>
      {hasSizes && expanded && (
        <div className="border-t border-border p-2 space-y-1 max-h-40 overflow-y-auto">
          {item.mediaUrls!.map(m => (
            <a
              key={m.id}
              href={m.url} download target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between text-[10px] text-muted-foreground hover:text-primary"
            >
              <span>{m.label} ({m.w}×{m.h})</span>
              <Download className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
      <div className="absolute inset-x-0 top-0 flex justify-between p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/50 to-transparent">
        <a
          href={item.mediaUrl} download target="_blank" rel="noopener noreferrer"
          className="h-7 w-7 flex items-center justify-center rounded-md bg-white/90 text-foreground hover:bg-white"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
        <button
          onClick={() => onDelete(item.id)}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-white/90 text-destructive hover:bg-white"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── مكوّن معاينة صغيرة لكل حجم ────────────────────────────────
function SizePreview({
  width, height,
  bgImg, logoImg, logoEl, textEls, bgColor,
}: {
  width: number; height: number;
  bgImg: HTMLImageElement | null; logoImg: HTMLImageElement | null;
  logoEl: LogoEl; textEls: TextEl[]; bgColor: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const PREV = 120; // عرض المعاينة الصغيرة
  const ph = Math.round(PREV * height / width);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCanvas(ctx, PREV, ph, bgImg, logoImg, logoEl, textEls, bgColor);
  }, [bgImg, logoImg, logoEl, textEls, bgColor, ph]);

  return (
    <canvas
      ref={ref}
      width={PREV} height={ph}
      className="w-full rounded border border-border/50"
    />
  );
}
