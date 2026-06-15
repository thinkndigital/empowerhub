"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, BookOpen, Users } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

const settingsSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون اسم المنظمة حرفين على الأقل." }),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "صيغة اللون غير صحيحة." }),
  logo: z.any(),
  courseSessionPrice: z.coerce.number().min(0, { message: "يجب أن يكون السعر 0 أو أكثر." }),
  mentorshipSessionPrice: z.coerce.number().min(0, { message: "يجب أن يكون السعر 0 أو أكثر." }),
});

export default function OrgSettingsPage() {
    const { toast } = useToast();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: "EmpowerHub",
            primaryColor: "#2563eb",
            courseSessionPrice: 50,
            mentorshipSessionPrice: 30,
        },
    });

    useEffect(() => {
        const savedName = localStorage.getItem('orgName');
        const savedColor = localStorage.getItem('orgPrimaryColor');
        const savedLogo = localStorage.getItem('orgLogo');
        if (savedName) {
            form.setValue('name', savedName);
        }
        if (savedColor) {
            form.setValue('primaryColor', savedColor);
        }
        if (savedLogo) {
            setLogoPreview(savedLogo);
        }
    }, [form]);

    const primaryColor = form.watch("primaryColor");

    useEffect(() => {
        if (primaryColor && /^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
            const hexToHsl = (hex: string): string => {
                hex = hex.replace(/^#/, '');
                let r = parseInt(hex.substring(0, 2), 16);
                let g = parseInt(hex.substring(2, 4), 16);
                let b = parseInt(hex.substring(4, 6), 16);
                r /= 255; g /= 255; b /= 255;
                let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;
                l = (cmax + cmin) / 2;
                if (delta !== 0) {
                    s = l > 0.5 ? delta / (2 - cmax - cmin) : delta / (cmax + cmin);
                    switch (cmax) {
                        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / delta + 2; break;
                        case b: h = (r - g) / delta + 4; break;
                    }
                    h = Math.round(h * 60);
                }
                if (h < 0) h += 360;
                s = Math.round(s * 100);
                l = Math.round(l * 100);
                return `${h} ${s}% ${l}%`;
            };
            document.documentElement.style.setProperty('--primary', hexToHsl(primaryColor));
        }
    }, [primaryColor]);


    function onSubmit(values: z.infer<typeof settingsSchema>) {
        localStorage.setItem('orgName', values.name);
        localStorage.setItem('orgPrimaryColor', values.primaryColor);

        if (values.logo && values.logo.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    const dataUrl = e.target.result as string;
                    localStorage.setItem('orgLogo', dataUrl);
                    window.dispatchEvent(new Event('org-settings-change'));
                }
            };
            reader.readAsDataURL(values.logo[0]);
        } else {
             window.dispatchEvent(new Event('org-settings-change'));
        }

        toast({
            title: "تم حفظ الإعدادات",
            description: "تم تحديث إعدادات المظهر والتسعير لمنظمتك.",
        });
    }

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            const file = files[0];
            form.setValue('logo', files);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
          <h1 className="text-lg font-semibold md:text-2xl">إعدادات المنظمة</h1>
          <p className="text-muted-foreground">إدارة تفاصيل منظمتك، المظهر، وإعدادات الحساب.</p>
      </div>

       <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            تخصيص المظهر
                        </CardTitle>
                        <CardDescription>
                            قم بتخصيص مظهر المنصة ليتناسب مع هوية منظمتك.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم المنظمة</FormLabel>
                                    <FormControl>
                                        <Input placeholder="اسم منظمتك" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        سيظهر هذا الاسم في رأس الشريط الجانبي.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="primaryColor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اللون الأساسي</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                                        </FormControl>
                                        <FormControl>
                                            <Input className="w-40" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormDescription>
                                        اختر اللون الذي يمثل هوية منظمتك.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>شعار المنظمة</FormLabel>
                                    <FormControl>
                                        <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                                    </FormControl>
                                    {logoPreview && (
                                        <div className="mt-4">
                                            <p className="text-sm text-muted-foreground">معاينة الشعار:</p>
                                            <Image src={logoPreview} alt="معاينة الشعار" width={80} height={80} className="rounded-md border p-2 mt-2 object-contain" />
                                        </div>
                                    )}
                                    <FormDescription>
                                        ارفع شعار منظمتك (يفضل أن يكون بصيغة SVG أو PNG).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            تسعير الخدمات
                        </CardTitle>
                        <CardDescription>
                            تحديد أسعار الجلسات بالدينار الأردني (د.أ) التي يقدمها المدربون والمرشدون.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="courseSessionPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> سعر جلسة التدريب (لكل شخص)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.5" min="0" placeholder="50" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        المبلغ المحتسب لكل مستفيد عن كل جلسة تدريب فردية.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mentorshipSessionPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> سعر جلسة الإرشاد (لكل شخص)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.5" min="0" placeholder="30" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                    المبلغ المحتسب لكل مستفيد عن كل جلسة إرشاد.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div>
                    <Button type="submit">
                        <Save className="ml-2 h-4 w-4" />
                        حفظ الإعدادات
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}
