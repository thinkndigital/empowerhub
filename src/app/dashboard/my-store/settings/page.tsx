"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { uploadFile as uploadToStorage } from "@/lib/upload-file";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Building, Facebook, Instagram, Twitter, MessageCircle, Link2, Copy, Check } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const storeSettingsSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون اسم المتجر حرفين على الأقل." }),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  socials: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export default function StoreSettingsPage() {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const { user: authUser, loading: authLoading } = useUser();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      coverUrl: "",
      location: "",
      phone: "",
      whatsapp: "",
      socials: { facebook: "", instagram: "", twitter: "" },
    },
  });

  const fetchStore = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/beneficiary/store', { headers: { authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.store) {
        setStoreId(json.store.id);
        setStoreSlug(json.store.slug || "");
        form.reset({
          name: json.store.name || "",
          description: json.store.description || "",
          logoUrl: json.store.logoUrl || "",
          coverUrl: json.store.coverUrl || "",
          location: json.store.location || "",
          phone: json.store.phone || "",
          whatsapp: json.store.whatsapp || "",
          socials: {
            facebook: json.store.socials?.facebook || "",
            instagram: json.store.socials?.instagram || "",
            twitter: json.store.socials?.twitter || "",
          },
        });
        if (json.store.logoUrl) setLogoPreview(json.store.logoUrl);
        if (json.store.coverUrl) setCoverPreview(json.store.coverUrl);
      }
    } catch {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("فشل في جلب بيانات المتجر.", "Failed to fetch store data.") });
    } finally {
      setLoading(false);
    }
  }, [authUser, form, toast]);

  useEffect(() => {
    if (!authLoading && authUser) fetchStore();
  }, [authLoading, authUser, fetchStore]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: StoreSettingsFormValues) {
    if (!authUser) return;
    setIsSaving(true);

    let finalLogoUrl = values.logoUrl || "";
    let finalCoverUrl = values.coverUrl || "";

    try {
      const token = await authUser.getIdToken();

      if (logoFile) {
        finalLogoUrl = await uploadToStorage(logoFile, `store-logos/${authUser.uid}`, token);
      }

      if (coverFile) {
        finalCoverUrl = await uploadToStorage(coverFile, `store-covers/${authUser.uid}`, token);
      }
      const storeData = { ...values, logoUrl: finalLogoUrl, coverUrl: finalCoverUrl, ...(storeId ? { id: storeId } : {}) };

      const method = storeId ? 'PUT' : 'POST';
      const res = await fetch('/api/beneficiary/store-settings', {
        method,
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(storeData),
      });

      if (!res.ok) throw new Error((await res.json()).error || bi('فشل الحفظ', 'Save failed'));

      const json = await res.json();
      if (!storeId && json.id) setStoreId(json.id);
      if (json.slug) setStoreSlug(json.slug);

      toast({ title: storeId ? bi("تم الحفظ بنجاح", "Saved successfully") : bi("تم إنشاء متجرك!", "Your store was created!"), description: bi("تم حفظ إعدادات متجرك.", "Your store settings have been saved.") });
    } catch (e: any) {
      toast({ variant: "destructive", title: bi("حدث خطأ!", "An error occurred!"), description: e.message || bi("لم نتمكن من حفظ الإعدادات.", "We couldn't save the settings.") });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Card className="border-0 shadow-sm"><CardContent className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></CardContent></Card>
      </div>
    );
  }

  const publicPath = `/stores/${storeSlug || storeId || ''}`;
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicPath}` : publicPath;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: bi("تعذر النسخ", "Could not copy"), description: bi("انسخ الرابط يدوياً.", "Please copy the link manually.") });
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("إعدادات المتجر", "Store settings")}</h1>
        <p className="text-muted-foreground">{bi("إدارة الهوية المرئية ومعلومات التواصل لمتجرك.", "Manage your store's visual identity and contact information.")}</p>
      </div>

      {storeId && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{bi("رابط متجرك الخاص", "Your store's link")}</p>
              <a href={publicPath} target="_blank" rel="noopener noreferrer" dir="ltr"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block">
                {publicUrl}
              </a>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1.5">
            {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {linkCopied ? bi('تم النسخ', 'Copied') : bi('نسخ الرابط', 'Copy link')}
          </Button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> {bi("المعلومات الأساسية", "Basic information")}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>{bi("اسم المتجر", "Store name")}</FormLabel><FormControl><Input placeholder={bi("مثال: إبداعات سارة", "e.g. Sara's Creations")} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>{bi("وصف المتجر", "Store description")}</FormLabel><FormControl><Textarea placeholder={bi("وصف موجز عن متجرك وما تقدمه...", "A brief description of your store and what it offers...")} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormItem>
                <FormLabel>{bi("شعار المتجر", "Store logo")}</FormLabel>
                <FormControl><Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleLogoChange} /></FormControl>
                {logoPreview && <div className="mt-2"><Image src={logoPreview} alt={bi("معاينة", "Preview")} width={100} height={100} className="rounded-md object-cover border" /></div>}
              </FormItem>
              <FormItem>
                <FormLabel>{bi("صورة الغلاف", "Cover image")}</FormLabel>
                <FormControl><Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleCoverChange} /></FormControl>
                {coverPreview && <div className="mt-2"><Image src={coverPreview} alt={bi("غلاف", "Cover")} width={300} height={100} className="rounded-md object-cover border w-full max-h-32" /></div>}
              </FormItem>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>{bi("معلومات التواصل", "Contact information")}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>{bi("الموقع (المدينة)", "Location (city)")}</FormLabel><FormControl><Input placeholder={bi("مثال: عمّان", "e.g. Amman")} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{bi("رقم الهاتف للتواصل", "Contact phone number")}</FormLabel><FormControl><Input dir="ltr" placeholder="+962 7..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" /> {bi("رقم واتساب", "WhatsApp number")}</FormLabel><FormControl><Input dir="ltr" placeholder="+966 5XX XXX XXXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>{bi("حسابات التواصل الاجتماعي", "Social media accounts")}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="socials.facebook" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4" /> {bi("فيسبوك", "Facebook")}</FormLabel><FormControl><Input dir="ltr" placeholder="https://facebook.com/yourpage" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="socials.instagram" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Instagram className="h-4 w-4" /> {bi("انستغرام", "Instagram")}</FormLabel><FormControl><Input dir="ltr" placeholder="https://instagram.com/yourprofile" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="socials.twitter" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Twitter className="h-4 w-4" /> {bi("إكس (تويتر سابقاً)", "X (formerly Twitter)")}</FormLabel><FormControl><Input dir="ltr" placeholder="https://x.com/yourhandle" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving}>
            <Save className="ml-2 h-4 w-4" />
            {isSaving ? bi('جاري الحفظ...', 'Saving...') : bi('حفظ الإعدادات', 'Save settings')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
