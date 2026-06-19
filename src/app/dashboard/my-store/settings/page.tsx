"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore, useStorage } from "@/firebase/provider";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, limit } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Building, Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const storeSettingsSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون اسم المتجر حرفين على الأقل." }),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  coverUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  socials: z.object({
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;
type StoreDocument = StoreSettingsFormValues & { id: string, organizationId: string, beneficiaryId: string };

export default function StoreSettingsPage() {
  const { toast } = useToast();
  const { user: authUser, userProfile } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  
  const [storeDoc, setStoreDoc] = useState<StoreDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchStoreData() {
      if (!firestore || !authUser) {
        // لا توقف loading إذا Firebase لم يُهيأ بعد — انتظر
        return;
      }
      setLoading(true);
      const storeQuery = query(
        collection(firestore, "stores"),
        where("beneficiaryId", "==", authUser.uid),
        limit(1)
      );
      try {
        const querySnapshot = await getDocs(storeQuery);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = { id: doc.id, ...doc.data() } as StoreDocument;
          setStoreDoc(data);
          form.reset(data);
          if (data.logoUrl) setLogoPreview(data.logoUrl);
          if ((data as any).coverUrl) setCoverPreview((data as any).coverUrl);
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
        toast({ variant: "destructive", title: "خطأ", description: "فشل في جلب بيانات المتجر." });
      } finally {
        setLoading(false);
      }
    }
    fetchStoreData();
  }, [firestore, authUser, form, toast]);

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
    if (!firestore || !storage || !authUser || !userProfile) return;
    
    setIsSaving(true);
    let finalLogoUrl = storeDoc?.logoUrl || "";
    let finalCoverUrl = (storeDoc as any)?.coverUrl || "";

    try {
      if (logoFile) {
        const uniqueFileName = `${authUser.uid}/${Date.now()}-${logoFile.name}`;
        const imageRef = storageRef(storage, `store-logos/${uniqueFileName}`);
        const snapshot = await uploadBytes(imageRef, logoFile);
        finalLogoUrl = await getDownloadURL(snapshot.ref);
      }

      if (coverFile) {
        const uniqueFileName = `${authUser.uid}/${Date.now()}-cover-${coverFile.name}`;
        const imageRef = storageRef(storage, `store-covers/${uniqueFileName}`);
        const snapshot = await uploadBytes(imageRef, coverFile);
        finalCoverUrl = await getDownloadURL(snapshot.ref);
      }

      const storeData = {
        ...values,
        logoUrl: finalLogoUrl,
        coverUrl: finalCoverUrl,
        beneficiaryId: authUser.uid,
        beneficiaryName: userProfile.name,
        organizationId: userProfile.organizationId || ""
      };

      if (storeDoc) {
        // Update existing store
        const storeRef = doc(firestore, 'stores', storeDoc.id);
        await updateDoc(storeRef, storeData);
        toast({ title: "تم الحفظ بنجاح", description: "تم تحديث إعدادات متجرك." });
      } else {
        // Create new store
        const newDocRef = await addDoc(collection(firestore, "stores"), storeData);
        setStoreDoc({ ...storeData, id: newDocRef.id, beneficiaryId: storeData.beneficiaryId, organizationId: storeData.organizationId }); // update state with new doc
        toast({ title: "تم إنشاء متجرك!", description: "تم حفظ إعدادات متجرك بنجاح." });
      }
    } catch (error) {
        console.error("Error saving store settings:", error);
        const err = error as any;
        const permissionError = new FirestorePermissionError({
            path: storeDoc ? `stores/${storeDoc.id}` : 'stores',
            operation: storeDoc ? 'update' : 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من حفظ الإعدادات." });
    } finally {
        setIsSaving(false);
    }
  }

  if (loading) {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <Card><CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent></Card>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">إعدادات المتجر</h1>
      <p className="text-muted-foreground mb-6">
        إدارة الهوية المرئية ومعلومات التواصل لمتجرك.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> المعلومات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>اسم المتجر</FormLabel><FormControl><Input placeholder="مثال: إبداعات سارة" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>وصف المتجر</FormLabel><FormControl><Textarea placeholder="وصف موجز عن متجرك وما تقدمه..." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormItem>
                        <FormLabel>شعار المتجر</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleLogoChange} />
                        </FormControl>
                        {logoPreview && (
                            <div className="mt-2"><Image src={logoPreview} alt="معاينة" width={100} height={100} className="rounded-md object-cover border" /></div>
                        )}
                        <FormMessage />
                    </FormItem>
                    <FormItem>
                        <FormLabel>صورة الغلاف</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleCoverChange} />
                        </FormControl>
                        {coverPreview && (
                            <div className="mt-2"><Image src={coverPreview} alt="غلاف" width={300} height={100} className="rounded-md object-cover border w-full max-h-32" /></div>
                        )}
                        <FormMessage />
                    </FormItem>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>معلومات التواصل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem><FormLabel>الموقع (المدينة)</FormLabel><FormControl><Input placeholder="مثال: عمّان" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>رقم الهاتف للتواصل</FormLabel><FormControl><Input dir="ltr" placeholder="+962 7..." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="whatsapp" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" /> رقم واتساب</FormLabel><FormControl><Input dir="ltr" placeholder="+966 5XX XXX XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>حسابات التواصل الاجتماعي</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="socials.facebook" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4" /> فيسبوك</FormLabel><FormControl><Input dir="ltr" placeholder="https://facebook.com/yourpage" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="socials.instagram" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Instagram className="h-4 w-4" /> انستغرام</FormLabel><FormControl><Input dir="ltr" placeholder="https://instagram.com/yourprofile" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="socials.twitter" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Twitter className="h-4 w-4" /> إكس (تويتر سابقاً)</FormLabel><FormControl><Input dir="ltr" placeholder="https://x.com/yourhandle" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <Button type="submit" disabled={isSaving}>
                <Save className="ml-2 h-4 w-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
        </form>
      </Form>
    </div>
  );
}
