# Project Snapshot

This file contains a snapshot of all the code in your project. You can use this to copy the entire project into another AI Studio session.

---

## File: .env

```

```

---

## File: .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# studio
src/ai/dev.ts
src/ai/genkit.ts
```

---

## File: README.md

```md
# Your EmpowerHub App is Live!

Congratulations! Your application has been successfully built and deployed.

This Next.js starter project, created in Firebase Studio, is now running in a production environment.

Thank you for using Firebase Studio.
```

---

## File: apphosting.yaml

```yaml
# The version of the App Hosting YAML schema.
version: v1alpha1

# The command to build your app.
build:
  # The command to run to build your app.
  run: npm run build
  # The path to your source code.
  sourceDir: .

# The command to run your app.
run:
  # The command to run to start your app.
  command: npm run start
  # Whether or not to preserve files generated during the build process.
  preserve: true
```

---

## File: next.config.js

```js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // !! WARN !!
    // This is set to `true` to bypass TypeScript errors during the build.
    // It is highly recommended to resolve the type errors instead of ignoring them.
    ignoreBuildErrors: false,
  },
  experimental: {
    ppr: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

## File: package.json

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 9002",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "engines": {
    "node": "20"
  },
  "dependencies": {
    "@hookform/resolvers": "3.6.0",
    "@radix-ui/react-accordion": "1.2.0",
    "@radix-ui/react-alert-dialog": "1.1.1",
    "@radix-ui/react-avatar": "1.1.0",
    "@radix-ui/react-checkbox": "1.1.0",
    "@radix-ui/react-collapsible": "1.1.0",
    "@radix-ui/react-dialog": "1.1.1",
    "@radix-ui/react-dropdown-menu": "2.1.1",
    "@radix-ui/react-label": "2.1.0",
    "@radix-ui/react-menubar": "1.1.1",
    "@radix-ui/react-popover": "1.1.1",
    "@radix-ui/react-progress": "1.1.0",
    "@radix-ui/react-radio-group": "1.2.0",
    "@radix-ui/react-scroll-area": "1.1.0",
    "@radix-ui/react-select": "2.1.1",
    "@radix-ui/react-separator": "1.1.0",
    "@radix-ui/react-slider": "1.2.0",
    "@radix-ui/react-slot": "1.1.0",
    "@radix-ui/react-switch": "1.1.0",
    "@radix-ui/react-tabs": "1.1.0",
    "@radix-ui/react-toast": "1.2.1",
    "@radix-ui/react-tooltip": "1.1.1",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.1",
    "date-fns": "3.6.0",
    "dotenv": "16.4.5",
    "embla-carousel-react": "8.1.5",
    "firebase": "10.12.2",
    "lucide-react": "0.395.0",
    "mitt": "3.0.1",
    "next": "14.2.4",
    "postcss": "8.4.38",
    "react": "18.3.1",
    "react-day-picker": "8.10.1",
    "react-dom": "18.3.1",
    "react-hook-form": "7.52.0",
    "recharts": "2.12.7",
    "tailwind-merge": "2.3.0",
    "tailwindcss": "3.4.4",
    "tailwindcss-animate": "1.0.7",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@types/node": "20.14.8",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.5.2"
  }
}
```

---

## File: src/ai/dev.ts

```ts
// This file is intentionally left empty to disable Genkit in production builds.
```

---

## File: src/ai/flows/personalized-empowerment-recommendations-flow.ts

```ts
'use server';
/**
 * @fileOverview This file now only contains the type definitions for the AI recommender
 * to prevent build failures. The runtime functionality is disabled.
 */

import {z} from 'zod';

const PersonalizedEmpowermentRecommendationsInputSchema = z.object({
  beneficiaryId: z.string().describe('The unique identifier for the beneficiary.'),
  currentProgress: z
    .string()
    .describe(
      "A summary of the beneficiary's current learning progress and achievements."
    ),
  skills: z
    .array(z.string())
    .describe('A list of key skills the beneficiary currently possesses.'),
  goals: z
    .string()
    .describe(
      "A detailed description of the beneficiary's career or personal development goals."
    ),
  completedModules: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the completed module.'),
        name: z.string().describe('Name of the completed module.'),
        category: z.string().describe('Category of the completed module.'),
      })
    )
    .describe('A list of training modules the beneficiary has already completed.'),
  availableModules: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the available module.'),
        name: z.string().describe('Name of the available module.'),
        description: z.string().describe('Description of the available module.'),
        category: z.string().describe('Category of the available module.'),
        link: z.string().url().describe('URL to access the available module.'),
      })
    )
    .describe('A list of all training modules currently available in the system.'),
  availableExternalResources: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the external resource.'),
        name: z.string().describe('Name of the external resource.'),
        description: z.string().describe('Description of the external resource.'),
        url: z.string().url().describe('URL to access the external resource.'),
        category: z.string().describe('Category of the external resource.'),
      })
    )
    .describe('A list of potential external resources relevant for empowerment.'),
  availableMentorshipTopics: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the mentorship topic.'),
        name: z.string().describe('Name of the mentorship topic.'),
        description: z.string().describe('Description of the mentorship topic.'),
      })
    )
    .describe('A list of potential mentorship topics for discussion with a mentor.'),
});

export type PersonalizedEmpowermentRecommendationsInput = z.infer<
  typeof PersonalizedEmpowermentRecommendationsInputSchema
>;

const PersonalizedEmpowermentRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        type: z
          .enum(['training_module', 'external_resource', 'mentorship_topic'])
          .describe('The type of recommendation.'),
        id: z.string().describe('The ID of the recommended item.'),
        title: z.string().describe('The title of the recommended item.'),
        description: z
          .string()
          .describe('A brief explanation of why this item is recommended.'),
        link: z.string().url().optional().describe('Optional URL for the recommendation.'),
        category: z.string().optional().describe('Optional category for the recommendation.'),
      })
    )
    .describe('A list of personalized recommendations.'),
});

export type PersonalizedEmpowermentRecommendationsOutput = z.infer<
  typeof PersonalizedEmpowermentRecommendationsOutputSchema
>;
```

---

## File: src/ai/genkit.ts

```ts
// This file is intentionally left empty to disable Genkit in production builds.
```

---

## File: src/app/admin-dashboard/analytics/page.tsx

```tsx

"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Building, Activity, ShoppingCart, Download, BookOpen, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface UserGrowthData {
  month: string;
  users: number;
  orgs: number;
}

interface SalesData {
  month: string;
  sales: number;
}

interface PieChartData {
  name: string;
  value: number;
  fill: string;
}

interface CourseEnrollmentData {
  name: string;
  enrollments: number;
}


const userChartConfig = {
  users: { label: "المستخدمون", color: "hsl(var(--chart-1))" },
  orgs: { label: "المنظمات", color: "hsl(var(--chart-2))" },
}
const salesChartConfig = {
    sales: { label: "المبيعات", color: "hsl(var(--chart-1))" },
}
const userRolesConfig = {
    beneficiaries: { label: "مستفيدون" },
    mentors: { label: "مرشدون" },
    coaches: { label: "مدربون" },
    orgs: { label: "مدراء منظمات" },
    admins: { label: "مشرفون" },
}
const courseEnrollmentConfig = {
    enrollments: { label: "عدد المسجلين", color: "hsl(var(--chart-2))" },
}


export default function AnalyticsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    userGrowth: true,
    salesGrowth: true,
    roleDistribution: true,
    courseEnrollment: true,
  });

  // Data is reset for production. In a real app, this would be fetched from the backend.
  const [userChartData, setUserChartData] = useState<UserGrowthData[]>([]);
  const [salesChartData, setSalesChartData] = useState<SalesData[]>([]);
  const [userRolesData, setUserRolesData] = useState<PieChartData[]>([]);
  const [courseEnrollmentData, setCourseEnrollmentData] = useState<CourseEnrollmentData[]>([]);

  const handleExport = (fullReport: boolean = false) => {
    const selectedReports = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions)
        .filter(([, isSelected]) => isSelected)
        .map(([reportName]) => reportName);

    if (selectedReports.length === 0) {
        toast({
            variant: "destructive",
            title: "لم يتم تحديد أي أجزاء",
            description: "الرجاء تحديد جزء واحد على الأقل من التقرير لتصديره.",
        });
        return;
    }

    toast({
      title: "جاري تصدير التقرير...",
      description: `سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.`,
    });
    setIsExportDialogOpen(false);
  }

  const handleCheckboxChange = (key: keyof typeof exportOptions) => {
    setExportOptions(prev => ({...prev, [key]: !prev[key]}));
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">تحليلات المنصة</h1>
         <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="ml-2 h-4 w-4" />
                    تصدير التقارير
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>تصدير التقارير والتحليلات</DialogTitle>
                    <DialogDescription>اختر أجزاء التقرير التي ترغب في تصديرها.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="font-medium">أجزاء التقرير</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="summary" checked={exportOptions.summary} onCheckedChange={() => handleCheckboxChange("summary")} />
                            <Label htmlFor="summary">الملخص الإحصائي</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="userGrowth" checked={exportOptions.userGrowth} onCheckedChange={() => handleCheckboxChange("userGrowth")} />
                            <Label htmlFor="userGrowth">نمو المستخدمين والمنظمات</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="salesGrowth" checked={exportOptions.salesGrowth} onCheckedChange={() => handleCheckboxChange("salesGrowth")} />
                            <Label htmlFor="salesGrowth">نمو المبيعات</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="roleDistribution" checked={exportOptions.roleDistribution} onCheckedChange={() => handleCheckboxChange("roleDistribution")} />
                            <Label htmlFor="roleDistribution">توزيع أدوار المستخدمين</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="courseEnrollment" checked={exportOptions.courseEnrollment} onCheckedChange={() => handleCheckboxChange("courseEnrollment")} />
                            <Label htmlFor="courseEnrollment">الدورات الأكثر تسجيلاً</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                    <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
                    <Button onClick={() => handleExport(true)}>تصدير التقرير الكامل</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنظمات</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>نمو المستخدمين والمنظمات</CardTitle>
            <CardDescription>نمو عدد المستخدمين والمنظمات الجدد على مدار الـ 6 أشهر الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userChartConfig} className="min-h-[250px] w-full relative">
              {userChartData.length === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
              ) : (
                <BarChart accessibilityLayer data={userChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Legend />
                    <Bar dataKey="users" fill="var(--color-users)" radius={4} name="المستخدمون" />
                    <Bar dataKey="orgs" fill="var(--color-orgs)" radius={4} name="المنظمات" />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

         <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>توزيع أدوار المستخدمين</CardTitle>
            <CardDescription>توزيع المستخدمين على مستوى المنصة حسب الدور.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={userRolesConfig} className="h-[250px] w-full relative">
                {userRolesData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                        <Pie data={userRolesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            return (
                            <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                            );
                        }}>
                            {userRolesData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                        </Pie>
                        <Legend iconSize={10} />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle>نمو المبيعات</CardTitle>
            <CardDescription>إجمالي المبيعات من متاجر المستفيدين على مدار الـ 6 أشهر الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={salesChartConfig} className="h-[250px] w-full relative">
                {salesChartData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <LineChart accessibilityLayer data={salesChartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value / 1000} ألف د.أ`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                    </LineChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الدورات الأكثر تسجيلاً</CardTitle>
            <CardDescription>ترتيب الدورات حسب عدد المستفيدين المسجلين فيها.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={courseEnrollmentConfig} className="h-[250px] w-full relative">
                {courseEnrollmentData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <BarChart accessibilityLayer data={courseEnrollmentData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                        <XAxis type="number" dataKey="enrollments" />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={4} name="عدد المسجلين" />
                    </BarChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
```

---

## File: src/app/admin-dashboard/courses/[courseId]/page.tsx

```tsx

"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Trash2, PlusCircle, ArrowRight, BookCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const courseEditSchema = z.object({
  title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
  category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
  description: z.string().optional(),
  videoUrl: z.string().url({ message: "الرجاء إدخال رابط فيديو صحيح (مثل يوتيوب أو فيميو)." }).optional().or(z.literal('')),
  quiz: z.object({
    question: z.string().optional(),
    options: z.array(z.object({ value: z.string().min(1, { message: "الخيار لا يمكن أن يكون فارغًا." }) })).max(4),
    correctAnswer: z.string().optional(),
  }).optional(),
  preAssessment: z.array(z.object({
    question: z.string().min(1, { message: "السؤال لا يمكن أن يكون فارغًا." }),
    type: z.enum(['rating', 'text']),
  })).optional(),
  postAssessment: z.array(z.object({
    question: z.string().min(1, { message: "السؤال لا يمكن أن يكون فارغًا." }),
    type: z.enum(['rating', 'text']),
  })).optional(),
});

type CourseEditFormValues = z.infer<typeof courseEditSchema>;

// Represents the data shape in Firestore
interface CourseDataFromDB {
  title: string;
  category: string;
  description?: string;
  videoUrl?: string;
  quiz?: {
    question: string;
    options: string[]; // Note: this is an array of strings
    correctAnswer: string;
  };
  preAssessment?: any[];
  postAssessment?: any[];
}


const AssessmentBuilder = ({ control, name, title }: { control: any, name: "preAssessment" | "postAssessment", title: string }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name
    });

    return (
        <div className="space-y-4">
            <h3 className="font-medium">{title}</h3>
            {fields.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md">
                    <div className="flex-grow space-y-2">
                        <FormField
                            control={control}
                            name={`${name}.${index}.question`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>السؤال {index + 1}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="نص السؤال..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name={`${name}.${index}.type`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>نوع السؤال</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر نوع السؤال" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="rating">تقييم (1-5)</SelectItem>
                                            <SelectItem value="text">نص مفتوح</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ question: "", type: "rating" })}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة سؤال
            </Button>
        </div>
    );
};


export default function AdminCourseEditPage({ params }: { params: { courseId: string } }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !params.courseId) return null;
    return doc(firestore, "courses", params.courseId);
  }, [firestore, params.courseId]);

  const { data: course, loading } = useDoc<CourseDataFromDB>(courseRef);

  const form = useForm<CourseEditFormValues>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      videoUrl: "",
      quiz: {
        question: "",
        options: [{ value: "" }, { value: "" }],
        correctAnswer: "",
      },
      preAssessment: [],
      postAssessment: [],
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        category: course.category,
        description: course.description || "",
        videoUrl: course.videoUrl || "",
        quiz: {
          question: course.quiz?.question || "",
          options: course.quiz?.options?.map(opt => ({ value: opt })) || [{ value: "" }, { value: "" }],
          correctAnswer: course.quiz?.correctAnswer || "",
        },
        preAssessment: course.preAssessment || [],
        postAssessment: course.postAssessment || [],
      });
    }
  }, [course, form]);

  const { fields: quizOptions, append: appendQuizOption, remove: removeQuizOption } = useFieldArray({
    control: form.control,
    name: "quiz.options",
  });

  async function onSubmit(values: CourseEditFormValues) {
    if (!courseRef) return;
    
    const dataToUpdate = {
        ...values,
        quiz: values.quiz ? {
            ...values.quiz,
            options: values.quiz.options.map(o => o.value).filter(Boolean)
        } : null,
    };
    
    if (dataToUpdate.quiz?.options.length === 0) {
        dataToUpdate.quiz = null;
    }


    updateDoc(courseRef, dataToUpdate)
    .then(() => {
        toast({
            title: "تم الحفظ بنجاح",
            description: `تم تحديث تفاصيل دورة "${values.title}".`,
        });
    })
    .catch((serverError) => {
        toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: "لم نتمكن من حفظ التغييرات. الرجاء المحاولة مرة أخرى.",
        });
        const permissionError = new FirestorePermissionError({
            path: courseRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!course) {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold">الدورة غير موجودة</h1>
            <p className="text-muted-foreground">لم نتمكن من العثور على الدورة التي تبحث عنها.</p>
            <Button asChild className="mt-4">
                <Link href="/admin-dashboard/courses">العودة إلى الدورات</Link>
            </Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-lg font-semibold md:text-2xl">تحرير محتوى الدورة (المشرف)</h1>
                 <p className="text-muted-foreground">أنت تقوم بتعديل دورة: <span className="font-bold text-primary">{course.title}</span></p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" asChild>
                    <Link href="/admin-dashboard/courses">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        العودة
                    </Link>
                </Button>
                <Button type="submit">
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التغييرات
                </Button>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>محتوى الفيديو</CardTitle>
                <CardDescription>أضف رابط الفيديو الرئيسي للدورة. يمكنك استخدام روابط من يوتيوب أو فيميو.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="videoUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>رابط الفيديو</FormLabel>
                        <FormControl><Input dir="ltr" placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>الاختبار القصير</CardTitle>
                <CardDescription>أنشئ اختبارًا قصيرًا للتحقق من فهم المستفيدين. اتركه فارغًا إذا لم تكن هناك حاجة لاختبار.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="quiz.question" render={({ field }) => (
                    <FormItem>
                        <FormLabel>السؤال</FormLabel>
                        <FormControl><Textarea placeholder="ما هو أهم عنصر في...؟" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <FormField
                    control={form.control}
                    name="quiz.correctAnswer"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>الخيارات (اختر الإجابة الصحيحة)</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col space-y-2"
                            >
                                {quizOptions.map((item, index) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name={`quiz.options.${index}.value`}
                                        render={({ field: optionField }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={optionField.value} />
                                                </FormControl>
                                                <Input {...optionField} placeholder={`الخيار ${index + 1}`} />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeQuizOption(index)} disabled={quizOptions.length <= 2}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => appendQuizOption({ value: "" })} disabled={quizOptions.length >= 4}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة خيار
                    </Button>
                    <FormDescription>يمكنك إضافة ما يصل إلى 4 خيارات.</FormDescription>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5" />التقييمات</CardTitle>
                <CardDescription>
                    أنشئ تقييمًا قبليًا وبعديًا لقياس مدى تقدم المستفيدين. هذه التقييمات اختيارية.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pre-assessment">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pre-assessment">التقييم القبلي</TabsTrigger>
                        <TabsTrigger value="post-assessment">التقييم البعدي</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pre-assessment" className="pt-4">
                        <AssessmentBuilder
                            control={form.control}
                            name="preAssessment"
                            title="أسئلة التقييم القبلي"
                        />
                    </TabsContent>
                    <TabsContent value="post-assessment" className="pt-4">
                       <AssessmentBuilder
                            control={form.control}
                            name="postAssessment"
                            title="أسئلة التقييم البعدي"
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
```

---

## File: src/app/admin-dashboard/courses/page.tsx

```tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Download, Edit, Trash2, Check, X } from "lucide-react";
import Link from 'next/link';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status?: "منشورة" | "مسودة";
};

const formSchema = z.object({
    title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
    category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
    description: z.string().optional(),
});


export default function CoursesPage() {
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
    const firestore = useFirestore();

    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "courses"));
    }, [firestore]);

    const { data: courses, loading } = useCollection<Course>(coursesQuery);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { title: "", category: "", description: "" },
    });

    async function onAddSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore) return;
        const newCourseData = { ...values, status: "مسودة" as const };
        const coursesCollection = collection(firestore, "courses");
        
        addDoc(coursesCollection, newCourseData)
            .then(() => {
                toast({ title: "تم بنجاح!", description: `تمت إضافة دورة "${values.title}" كمسودة.` });
                form.reset();
                setIsAddDialogOpen(false);
            })
            .catch((serverError) => {
                toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من إضافة الدورة." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: coursesCollection.path, operation: 'create', requestResourceData: newCourseData }));
            });
    }
    
    async function handlePublish(course: Course) {
        if (!firestore) return;
        const courseRef = doc(firestore, "courses", course.id);
        const newStatus = course.status === "منشورة" ? "مسودة" : "منشورة";
        
        updateDoc(courseRef, { status: newStatus })
        .then(() => {
            toast({
                title: newStatus === "منشورة" ? "تم النشر!" : "تم الإلغاء!",
                description: `تم تحديث حالة دورة "${course.title}".`,
            });
        }).catch((err) => {
             toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية التحديث."});
             const permissionError = new FirestorePermissionError({ path: courseRef.path, operation: 'update', requestResourceData: { status: newStatus } });
             errorEmitter.emit('permission-error', permissionError);
        });
    }
    
    const handleDelete = async () => {
        if (!deleteCourse || !firestore) return;
        const courseRef = doc(firestore, 'courses', deleteCourse.id);
        deleteDoc(courseRef)
            .then(() => {
                toast({ variant: "destructive", title: "تم الحذف!", description: `تم حذف دورة "${deleteCourse.title}".` });
                setDeleteCourse(null);
            })
            .catch((serverError) => {
                toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من حذف الدورة." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: courseRef.path, operation: 'delete' }));
                setDeleteCourse(null);
            });
    }

    const handleExport = () => {
        toast({ title: "جاري تصدير قائمة الدورات...", description: "سيتم تنزيل ملف CSV قريبًا." });
    }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>الدورات التدريبية</CardTitle>
                <CardDescription>
                إدارة جميع الدورات التدريبية المتاحة على المنصة.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة دورة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة دورة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل الدورة الجديدة هنا. انقر على "حفظ" عند الانتهاء.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input placeholder="مثال: أساسيات البرمجة" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input placeholder="مثال: التكنولوجيا" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>وصف الدورة (اختياري)</FormLabel><FormControl><Textarea placeholder="وصف موجز لمحتوى الدورة..." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                                <Button type="submit">حفظ الدورة</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان الدورة</TableHead>
              <TableHead className="hidden md:table-cell">الفئة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && courses?.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                 <TableCell className="hidden md:table-cell">{course.category || 'غير مصنف'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={course.status === "منشورة" ? "default" : "secondary"}>
                    {course.status || 'مسودة'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                         <Link href={`/admin-dashboard/courses/${course.id}`}>
                            <Edit className="ml-2 h-4 w-4" />
                            تحرير المحتوى
                         </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handlePublish(course)}>
                         {course.status === "منشورة" ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                         {course.status === "منشورة" ? 'إلغاء النشر' : 'نشر الدورة'}
                       </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setDeleteCourse(course); }}>
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف الدورة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && (!courses || courses.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">لا توجد دورات لعرضها.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <AlertDialog open={!!deleteCourse} onOpenChange={(isOpen) => !isOpen && setDeleteCourse(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف دورة "{deleteCourse?.title}" نهائيًا.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>نعم، قم بالحذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
```

---

## File: src/app/admin-dashboard/layout.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Search,
  Settings,
  Users,
  Building,
  Shield,
  BarChartHorizontal,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useMemo } from "react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  { href: "/admin-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/admin-dashboard/organizations", label: "المنظمات", icon: Building },
  { href: "/admin-dashboard/users", label: "المستخدمون", icon: Users },
  { href: "/admin-dashboard/mentors", label: "المرشدون", icon: Users },
  { href: "/admin-dashboard/courses", label: "الدورات", icon: BookOpen },
  { href: "/admin-dashboard/analytics", label: "تحليلات المنصة", icon: BarChartHorizontal },
  { href: "/admin-dashboard/messages", label: "الرسائل", icon: MessageSquare },
];


export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-admin',
    name: 'مشرف تجريبي',
    email: 'admin@example.com',
    role: 'admin',
    avatarUrl: `https://picsum.photos/seed/demo-admin/40/40`,
  }), []);

  const userProfile = authUser ? realUserProfile : demoUserProfile;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile) { // A safeguard for when real user exists but profile is still loading or in demo mode
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile.name || 'مستخدم';
  const displayEmail = userProfile.email || 'لا يوجد بريد إلكتروني';

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">EmpowerHub</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <div className="p-2 text-center text-sm bg-primary/10 mx-2 rounded-md border border-primary/20">
             <p className="font-semibold text-primary">لوحة تحكم المشرف</p>
           </div>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton asChild tooltip="إعدادات النظام">
             <Link href="/admin-dashboard/settings">
                <Settings />
                <span>إعدادات النظام</span>
             </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="بحث..."
                  className="w-full appearance-none bg-background pr-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/admin-dashboard/messages">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">الرسائل</span>
              </Link>
            </Button>
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar>
                   <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount dir="rtl">
              <DropdownMenuLabel className="font-normal text-right">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               {authUser ? (
                <>
                  <DropdownMenuItem className="text-right">الملف الشخصي</DropdownMenuItem>
                  <DropdownMenuItem className="text-right">إعدادات النظام</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-right">
                    تسجيل الخروج
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">
                    تسجيل الدخول
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## File: src/app/admin-dashboard/mentors/page.tsx

```tsx

"use client"

import { MoreHorizontal, Download, UserX, MessageSquare, User, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useState } from "react";
import Link from "next/link";

export default function MentorsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [mentorToView, setMentorToView] = useState<UserProfile | null>(null);

  const mentorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "mentor"));
  }, [firestore]);

  const { data: mentors, loading } = useCollection<UserProfile>(mentorsQuery);

  const handleExport = () => {
    toast({
      title: "جاري تصدير قائمة المرشدين...",
      description: "سيتم تنزيل ملف CSV قريبًا.",
    });
  };

  const handleToggleStatus = async (mentor: UserProfile) => {
    if (!firestore) return;
    const mentorRef = doc(firestore, "users", mentor.id);
    const newStatus = mentor.status === "نشط" ? "غير نشط" : "نشط";

    updateDoc(mentorRef, { status: newStatus })
        .then(() => {
            toast({
                title: `تم تغيير حالة المرشد`,
                description: `أصبحت حالة ${mentor.name || 'المرشد'} الآن "${newStatus}".`,
            });
        })
        .catch((err) => {
            toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية التحديث."});
            const permissionError = new FirestorePermissionError({ path: mentorRef.path, operation: 'update', requestResourceData: { status: newStatus } });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>المرشدون</CardTitle>
            <CardDescription>
              إدارة المرشدين في المنصة وتتبع أدائهم.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
              <TableHead>مجال الخبرة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && mentors?.map((mentor) => {
              const mentorName = mentor.name || 'مرشد بلا اسم';
              return (
              <TableRow key={mentor.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={mentor.avatarUrl || `https://picsum.photos/seed/${mentor.id}/40/40`} alt={mentorName} />
                      <AvatarFallback>{mentorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{mentorName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{mentor.email || 'لا يوجد بريد'}</TableCell>
                <TableCell>{mentor.expertise || "غير محدد"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={mentor.status === "نشط" ? "default" : "secondary"}>
                    {mentor.status || 'غير محدد'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setMentorToView(mentor)}>
                        <Eye className="ml-2 h-4 w-4" />
                        عرض الملف الشخصي
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin-dashboard/messages">
                            <MessageSquare className="ml-2 h-4 w-4" />
                            إرسال رسالة
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(mentor)}
                        className={mentor.status === "نشط" ? "text-red-500" : ""}
                      >
                        <UserX className="ml-2 h-4 w-4" />
                        {mentor.status === "نشط" ? "إيقاف الحساب" : "تفعيل الحساب"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
            {!loading && (!mentors || mentors.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">لا يوجد مرشدون لعرضهم.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!mentorToView} onOpenChange={(isOpen) => !isOpen && setMentorToView(null)}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>الملف الشخصي للمرشد</DialogTitle>
                <DialogDescription>تفاصيل المرشد {mentorToView?.name || 'بلا اسم'}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={mentorToView?.avatarUrl || `https://picsum.photos/seed/${mentorToView?.id}/100/100`} alt={mentorToView?.name || 'مرشد'} />
                    <AvatarFallback>{mentorToView?.name?.charAt(0) || 'M'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{mentorToView?.name || 'مرشد بلا اسم'}</h3>
                    <p className="text-muted-foreground">{mentorToView?.email || 'لا يوجد بريد إلكتروني'}</p>
                </div>
                <div className="text-right space-y-2 border-t pt-4">
                    <p><strong>مجال الخبرة:</strong> {mentorToView?.expertise || 'غير محدد'}</p>
                    <p><strong>الحالة:</strong> <Badge variant={mentorToView?.status === "نشط" ? "default" : "secondary"}>{mentorToView?.status || 'غير محدد'}</Badge></p>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
```

---

## File: src/app/admin-dashboard/messages/page.tsx

```tsx
"use client";

import { ChatInterface } from "@/components/chat-interface";

export default function AdminMessagesPage() {
  return (
    <ChatInterface 
      title="مركز رسائل المشرف"
      description="التواصل المباشر مع مدراء المنظمات الشريكة."
    />
  );
}
```

---

## File: src/app/admin-dashboard/organizations/page.tsx

```tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, Download, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type Organization = {
  id: string;
  name: string;
  joined?: string;
  status?: "نشط" | "غير نشط";
  features?: {
      courses: boolean;
      mentorship: boolean;
  }
}

const orgFormSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون اسم المنظمة حرفين على الأقل." }),
  features: z.object({
    courses: z.boolean().default(false),
    mentorship: z.boolean().default(false),
  }).default({ courses: false, mentorship: false }),
});

export default function OrganizationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);
  const [orgToView, setOrgToView] = useState<Organization | null>(null);

  const organizationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "organizations"));
  }, [firestore]);

  const { data: organizations, loading } = useCollection<Organization>(organizationsQuery);

  const form = useForm<z.infer<typeof orgFormSchema>>({
    resolver: zodResolver(orgFormSchema),
  });

  useEffect(() => {
    if (orgToEdit) {
      form.reset({
        name: orgToEdit.name,
        features: {
          courses: orgToEdit.features?.courses ?? false,
          mentorship: orgToEdit.features?.mentorship ?? false,
        }
      });
    }
  }, [orgToEdit, form]);

  const handleExport = () => {
    toast({
      title: "جاري تصدير قائمة المنظمات...",
      description: "سيتم تنزيل ملف CSV قريبًا.",
    });
  }

  async function onEditSubmit(values: z.infer<typeof orgFormSchema>) {
    if (!firestore || !orgToEdit) return;

    const orgRef = doc(firestore, 'organizations', orgToEdit.id);
    updateDoc(orgRef, values)
      .then(() => {
        toast({
          title: "تم الحفظ!",
          description: `تم تحديث منظمة "${values.name}".`,
        });
        setOrgToEdit(null);
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "حدث خطأ!",
          description: "لم نتمكن من تحديث المنظمة.",
        });
        const permissionError = new FirestorePermissionError({
          path: orgRef.path,
          operation: 'update',
          requestResourceData: values
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  const handleDelete = () => {
    if (!firestore || !orgToDelete) return;
    
    const orgRef = doc(firestore, 'organizations', orgToDelete.id);
    deleteDoc(orgRef)
      .then(() => {
        toast({
            variant: "destructive",
            title: "تم الحذف!",
            description: `تم حذف منظمة "${orgToDelete.name}".`,
        });
        setOrgToDelete(null);
      })
      .catch((err) => {
        toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: "لم نتمكن من حذف المنظمة. الرجاء المحاولة مرة أخرى.",
        });
         const permissionError = new FirestorePermissionError({
            path: orgRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>المنظمات</CardTitle>
            <CardDescription>
              إدارة المنظمات الشريكة وصلاحياتهم.
            </CardDescription>
          </div>
           <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden md:table-cell">تاريخ الانضمام</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="hidden md:table-cell text-center">
                عدد المستفيدين
              </TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell className="hidden md:table-cell text-center"><Skeleton className="h-4 w-[20px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {!loading && organizations && organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                 <TableCell className="hidden md:table-cell">{org.joined ? new Date(org.joined).toLocaleDateString('ar-SA') : '-'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={org.status === "نشط" ? "default" : "secondary"}>
                    {org.status || 'غير محدد'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  -
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setOrgToView(org)}>
                        <Eye className="ml-2 h-4 w-4" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setOrgToEdit(org)}>
                        <Edit className="ml-2 h-4 w-4" />
                        تحرير الصلاحيات والاسم
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setOrgToDelete(org); }}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {!loading && (!organizations || organizations.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">لا توجد منظمات لعرضها.</TableCell>
              </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!orgToView} onOpenChange={(isOpen) => !isOpen && setOrgToView(null)}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>تفاصيل منظمة "{orgToView?.name}"</DialogTitle>
                <DialogDescription>عرض تفاصيل وصلاحيات المنظمة.</DialogDescription>
            </DialogHeader>
             <div className="py-4 space-y-2 text-sm">
                <p><strong>الاسم:</strong> {orgToView?.name}</p>
                <p><strong>تاريخ الانضمام:</strong> {orgToView?.joined ? new Date(orgToView.joined).toLocaleDateString('ar-SA') : '-'}</p>
                <p><strong>الحالة:</strong> <Badge variant={orgToView?.status === "نشط" ? "default" : "secondary"}>{orgToView?.status}</Badge></p>
                 <div className="border-t pt-4 mt-4 space-y-2">
                    <h4 className="font-semibold">الصلاحيات المتاحة</h4>
                    <p>الدورات التدريبية: <span className="font-medium">{orgToView?.features?.courses ? 'مفعل' : 'معطل'}</span></p>
                    <p>الإرشاد: <span className="font-medium">{orgToView?.features?.mentorship ? 'مفعل' : 'معطل'}</span></p>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>


    <Dialog open={!!orgToEdit} onOpenChange={(isOpen) => !isOpen && setOrgToEdit(null)}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>تحرير المنظمة</DialogTitle>
                <DialogDescription>تعديل اسم وصلاحيات منظمة "{orgToEdit?.name}".</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-6 pt-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>اسم المنظمة</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    <div className="space-y-4">
                        <FormLabel>الصلاحيات المتاحة</FormLabel>
                        <FormDescription>تمكين أو تعطيل الميزات الرئيسية للمنظمة.</FormDescription>
                        <FormField
                            control={form.control}
                            name="features.courses"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>الدورات التدريبية</FormLabel>
                                        <FormDescription>السماح للمنظمة بإدارة وتعيين الدورات.</FormDescription>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="features.mentorship"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>الإرشاد</FormLabel>
                                        <FormDescription>السماح للمنظمة بإدارة وتعيين المرشدين.</FormDescription>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                        <Button type="submit">حفظ التغييرات</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>


     <AlertDialog open={!!orgToDelete} onOpenChange={(isOpen) => !isOpen && setOrgToDelete(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف منظمة "{orgToDelete?.name}" وجميع بياناتها المرتبطة بها.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>نعم، قم بالحذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
```

---

## File: src/app/admin-dashboard/page.tsx

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Users,
  Activity,
  Building,
  BookOpen,
  ShoppingCart
} from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم الرئيسية</h1>
        <p className="text-muted-foreground">
          نظرة عامة وشاملة على أداء المنصة بالكامل.
        </p>
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المستخدمين
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المنظمات
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>مرحبا بك في لوحة التحكم</CardTitle>
            <CardDescription>
              هنا يمكنك إدارة المنظمات والمستخدمين وعرض التقارير.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}
```

---

## File: src/app/admin-dashboard/settings/page.tsx

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save } from "lucide-react";

const settingsSchema = z.object({
  currency: z.enum(["د.أ", "$", "€"]),
});

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: "د.أ", // This would come from a database in a real app
    },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    console.log("Saving settings:", values);
    // In a real app, you would save this to a global state/database
    toast({
      title: "تم حفظ الإعدادات",
      description: `تم تحديث العملة الافتراضية إلى ${values.currency}.`,
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
       <h1 className="text-lg font-semibold md:text-2xl mb-4">إعدادات النظام</h1>
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                إعدادات العملة
            </CardTitle>
            <CardDescription>
                تحديد العملة الافتراضية المستخدمة في جميع أنحاء المنصة، بما في ذلك متاجر المستفيدين.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>العملة الافتراضية</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="اختر العملة" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="د.أ">دينار أردني (د.أ)</SelectItem>
                                    <SelectItem value="$">دولار أمريكي ($)</SelectItem>
                                    <SelectItem value="€">يورو (€)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                ستظهر هذه العملة في جميع الأسعار والمعاملات المالية.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">
                        <Save className="ml-2 h-4 w-4" />
                        حفظ التغييرات
                    </Button>
                </form>
            </Form>
        </CardContent>
       </Card>
    </div>
  );
}
```

---

## File: src/app/admin-dashboard/users/page.tsx

```tsx

"use client";

import { MoreHorizontal, Download, UserX, Edit, User, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, doc, updateDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


type Organization = { id: string; name: string; };

// A mapping for roles to display in Arabic
const roleMap: { [key: string]: string } = {
    admin: "مشرف",
    organization: "مدير منظمة",
    mentor: "مرشد",
    beneficiary: "مستفيد",
    coach: "مدرب",
    team_member: "عضو فريق"
};

const editUserSchema = z.object({
  role: z.string({ required_error: "الرجاء اختيار دور للمستخدم." }),
});

export default function UsersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userToView, setUserToView] = useState<UserProfile | null>(null);

  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (userToEdit) {
      form.setValue("role", userToEdit.role || "");
    }
  }, [userToEdit, form]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const organizationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "organizations"));
  }, [firestore]);
  const { data: organizations, loading: orgsLoading } = useCollection<Organization>(organizationsQuery);

  const orgMap = useMemo(() => {
      if (!organizations) return new Map();
      return new Map(organizations.map(o => [o.id, o.name]));
  }, [organizations]);

  const loading = usersLoading || orgsLoading;


  const handleExport = () => {
    toast({
      title: "جاري تصدير قائمة المستخدمين...",
      description: "سيتم تنزيل ملف CSV قريبًا.",
    });
  };

  const handleToggleStatus = async (user: UserProfile) => {
    if (!firestore) return;

    const userRef = doc(firestore, "users", user.id);
    const newStatus = user.status === "نشط" ? "غير نشط" : "نشط";
    
    updateDoc(userRef, { status: newStatus })
        .then(() => {
            toast({
                title: `تم تغيير حالة المستخدم`,
                description: `أصبحت حالة ${user.name || 'المستخدم'} الآن "${newStatus}".`,
                variant: newStatus === 'غير نشط' ? 'destructive' : 'default',
            });
        })
        .catch((err) => {
            toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية التحديث."});
            const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { status: newStatus } });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  async function onEditSubmit(values: z.infer<typeof editUserSchema>) {
    if (!firestore || !userToEdit) return;

    const userRef = doc(firestore, "users", userToEdit.id);
    updateDoc(userRef, { role: values.role })
      .then(() => {
        toast({
          title: "تم تحديث الدور!",
          description: `تم تغيير دور ${userToEdit.name || 'المستخدم'} إلى ${roleMap[values.role] || values.role}.`,
        });
        setUserToEdit(null);
      })
      .catch((err) => {
        toast({ variant: "destructive", title: "خطأ!", description: "فشل تحديث الدور."});
        const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { role: values.role } });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>المستخدمون</CardTitle>
            <CardDescription>
              عرض وإدارة جميع المستخدمين المسجلين على المنصة.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead className="hidden md:table-cell">المنظمة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && users?.map((user) => {
              const userName = user.name || 'مستخدم بلا اسم';
              return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`} alt={userName} />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{userName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                <TableCell>{roleMap[user.role || ''] || user.role || 'غير محدد'}</TableCell>
                <TableCell className="hidden md:table-cell">{orgMap.get(user.organizationId || "") || "EmpowerHub"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={user.status === "نشط" ? "default" : "secondary"}>
                    {user.status || "غير محدد"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setUserToView(user)}>
                        <Eye className="ml-2 h-4 w-4" />
                        عرض الملف الشخصي
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setUserToEdit(user)}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل الدور
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(user)}
                        className={user.status === "نشط" ? "text-red-500" : ""}
                      >
                        <UserX className="ml-2 h-4 w-4" />
                        {user.status === "نشط" ? "حظر المستخدم" : "تفعيل المستخدم"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
             {!loading && (!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">لا يوجد مستخدمون لعرضهم.</TableCell>
              </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!userToView} onOpenChange={(isOpen) => !isOpen && setUserToView(null)}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>الملف الشخصي</DialogTitle>
                <DialogDescription>تفاصيل المستخدم {userToView?.name || 'بلا اسم'}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={userToView?.avatarUrl || `https://picsum.photos/seed/${userToView?.id}/100/100`} alt={userToView?.name || ''} />
                    <AvatarFallback>{userToView?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{userToView?.name || 'مستخدم بلا اسم'}</h3>
                    <p className="text-muted-foreground">{userToView?.email || 'لا يوجد بريد إلكتروني'}</p>
                </div>
                <div className="text-right space-y-2 border-t pt-4">
                    <p><strong>الدور:</strong> {roleMap[userToView?.role || ''] || userToView?.role || 'غير محدد'}</p>
                    <p><strong>المنظمة:</strong> {orgMap.get(userToView?.organizationId || "") || 'EmpowerHub (المنصة الرئيسية)'}</p>
                    <p><strong>الحالة:</strong> <Badge variant={userToView?.status === "نشط" ? "default" : "secondary"}>{userToView?.status || 'غير محدد'}</Badge></p>
                </div>
            </div>
        </DialogContent>
    </Dialog>


    <Dialog open={!!userToEdit} onOpenChange={(isOpen) => !isOpen && setUserToEdit(null)}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل دور المستخدم</DialogTitle>
          <DialogDescription>تغيير دور {userToEdit?.name || 'المستخدم'}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الدور الجديد</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر دورًا" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(roleMap).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button type="submit">حفظ التغييرات</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
```

---

## File: src/app/coach-dashboard/analytics/page.tsx

```tsx

"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Activity, Download, CheckCircle, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EnrollmentChartData {
  month: string;
  users: number;
}

interface CompletionRateData {
  course: string;
  rate: number;
}

interface EarningsData {
  month: string;
  earnings: number;
}

interface TopCourseData {
  title: string;
  enrolled: number;
  completion: string;
}

const enrollmentChartConfig = {
  users: { label: "الطلاب الجدد", color: "hsl(var(--chart-1))" },
}
const completionRateConfig = {
    rate: { label: "معدل الإكمال", color: "hsl(var(--chart-2))" },
}
const earningsConfig = {
  earnings: { label: "الأرباح", color: "hsl(var(--chart-1))" },
}

export default function CoachAnalyticsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    enrollment: true,
    completion: true,
    earnings: true,
    topCourses: true,
  });

  // Data is reset for production. In a real app, this would be fetched from the backend.
  const [enrollmentChartData, setEnrollmentChartData] = useState<EnrollmentChartData[]>([]);
  const [completionRateData, setCompletionRateData] = useState<CompletionRateData[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [topCoursesData, setTopCoursesData] = useState<TopCourseData[]>([]);

  const handleExport = (fullReport: boolean = false) => {
    const selectedReports = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions)
        .filter(([, isSelected]) => isSelected)
        .map(([reportName]) => reportName);

    if (selectedReports.length === 0) {
        toast({
            variant: "destructive",
            title: "لم يتم تحديد أي أجزاء",
            description: "الرجاء تحديد جزء واحد على الأقل من التقرير لتصديره.",
        });
        return;
    }

    toast({
      title: "جاري تصدير التقرير...",
      description: `سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.`,
    });
    setIsExportDialogOpen(false);
  }

  const handleCheckboxChange = (key: keyof typeof exportOptions) => {
    setExportOptions(prev => ({...prev, [key]: !prev[key]}));
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">تحليلات الدورات</h1>
         <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="ml-2 h-4 w-4" />
                    تصدير التقارير
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>تصدير التقارير والتحليلات</DialogTitle>
                    <DialogDescription>اختر أجزاء التقرير التي ترغب في تصديرها.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="font-medium">أجزاء التقرير</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="summary" checked={exportOptions.summary} onCheckedChange={() => handleCheckboxChange("summary")} />
                            <Label htmlFor="summary">الملخص الإحصائي</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="enrollment" checked={exportOptions.enrollment} onCheckedChange={() => handleCheckboxChange("enrollment")} />
                            <Label htmlFor="enrollment">نمو الطلاب</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="completion" checked={exportOptions.completion} onCheckedChange={() => handleCheckboxChange("completion")} />
                            <Label htmlFor="completion">معدل إكمال الدورات</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="earnings" checked={exportOptions.earnings} onCheckedChange={() => handleCheckboxChange("earnings")} />
                            <Label htmlFor="earnings">تطور الأرباح</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="topCourses" checked={exportOptions.topCourses} onCheckedChange={() => handleCheckboxChange("topCourses")} />
                            <Label htmlFor="topCourses">الدورات الأفضل أداءً</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                    <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
                    <Button onClick={() => handleExport(true)}>تصدير التقرير الكامل</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المسجلين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلاب النشطون</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط معدل الإكمال</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">لكل الدورات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">الأرباح من الجلسات التدريبية</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نمو الطلاب</CardTitle>
            <CardDescription>عدد الطلاب الجدد المسجلين في دوراتك على مدار الـ 6 أشهر الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={enrollmentChartConfig} className="h-[250px] w-full relative">
                {enrollmentChartData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <LineChart accessibilityLayer data={enrollmentChartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Line dataKey="users" type="monotone" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                    </LineChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>معدل إكمال الدورات</CardTitle>
            <CardDescription>مقارنة بين معدلات إكمال أشهر دوراتك.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={completionRateConfig} className="h-[250px] w-full relative">
                {completionRateData.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <BarChart accessibilityLayer data={completionRateData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="course" tickLine={false} tickMargin={10} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value}%`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="rate" fill="var(--color-rate)" radius={4} />
                    </BarChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
          <Card>
              <CardHeader>
                <CardTitle>تطور الأرباح الشهرية</CardTitle>
                <CardDescription>إجمالي أرباحك من الجلسات التدريبية على مدار 6 أشهر.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={earningsConfig} className="h-[250px] w-full relative">
                    {earningsData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                    ) : (
                        <LineChart accessibilityLayer data={earningsData} margin={{ left: -20, right: 10 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value} د.أ`}/>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Line dataKey="earnings" type="monotone" stroke="var(--color-earnings)" strokeWidth={2} dot={false} />
                        </LineChart>
                    )}
                </ChartContainer>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                <CardTitle>الدورات الأفضل أداءً</CardTitle>
                <CardDescription>قائمة بالدورات الأعلى تسجيلاً ومعدل إكمال.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>الدورة</TableHead>
                              <TableHead className="text-center">المسجلون</TableHead>
                              <TableHead className="text-center">معدل الإكمال</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {topCoursesData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">لا توجد بيانات لعرضها.</TableCell>
                            </TableRow>
                          ) : topCoursesData.map((course) => (
                            <TableRow key={course.title}>
                                <TableCell className="font-medium">{course.title}</TableCell>
                                <TableCell className="text-center">{course.enrolled}</TableCell>
                                <TableCell className="text-center">{course.completion}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      </div>
    </>
  );
}
```

---

## File: src/app/coach-dashboard/courses/[courseId]/page.tsx

```tsx

"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Trash2, PlusCircle, ArrowRight, BookCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const courseEditSchema = z.object({
  title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
  category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
  description: z.string().optional(),
  videoUrl: z.string().url({ message: "الرجاء إدخال رابط فيديو صحيح (مثل يوتيوب أو فيميو)." }).optional().or(z.literal('')),
  quiz: z.object({
    question: z.string().optional(),
    options: z.array(z.object({ value: z.string().min(1, { message: "الخيار لا يمكن أن يكون فارغًا." }) })).max(4),
    correctAnswer: z.string().optional(),
  }).optional(),
  preAssessment: z.array(z.object({
    question: z.string().min(1, { message: "السؤال لا يمكن أن يكون فارغًا." }),
    type: z.enum(['rating', 'text']),
  })).optional(),
  postAssessment: z.array(z.object({
    question: z.string().min(1, { message: "السؤال لا يمكن أن يكون فارغًا." }),
    type: z.enum(['rating', 'text']),
  })).optional(),
});

type CourseEditFormValues = z.infer<typeof courseEditSchema>;

// Represents the data shape in Firestore
interface CourseDataFromDB {
  title: string;
  category: string;
  description?: string;
  videoUrl?: string;
  quiz?: {
    question: string;
    options: string[]; // Note: this is an array of strings
    correctAnswer: string;
  };
  preAssessment?: any[];
  postAssessment?: any[];
}

const AssessmentBuilder = ({ control, name, title }: { control: any, name: "preAssessment" | "postAssessment", title: string }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name
    });

    return (
        <div className="space-y-4">
            <h3 className="font-medium">{title}</h3>
            {fields.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md">
                    <div className="flex-grow space-y-2">
                        <FormField
                            control={control}
                            name={`${name}.${index}.question`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>السؤال {index + 1}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="نص السؤال..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name={`${name}.${index}.type`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>نوع السؤال</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر نوع السؤال" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="rating">تقييم (1-5)</SelectItem>
                                            <SelectItem value="text">نص مفتوح</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ question: "", type: "rating" })}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة سؤال
            </Button>
        </div>
    );
};

export default function CourseEditPage({ params }: { params: { courseId: string } }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !params.courseId) return null;
    return doc(firestore, "courses", params.courseId);
  }, [firestore, params.courseId]);

  const { data: course, loading } = useDoc<CourseDataFromDB>(courseRef);

  const form = useForm<CourseEditFormValues>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      videoUrl: "",
      quiz: {
        question: "",
        options: [{ value: "" }, { value: "" }],
        correctAnswer: "",
      },
      preAssessment: [],
      postAssessment: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "quiz.options",
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        category: course.category,
        description: course.description || "",
        videoUrl: course.videoUrl || "",
        quiz: {
          question: course.quiz?.question || "",
          options: course.quiz?.options?.map(opt => ({ value: opt })) || [{ value: "" }, { value: "" }],
          correctAnswer: course.quiz?.correctAnswer || "",
        },
        preAssessment: course.preAssessment || [],
        postAssessment: course.postAssessment || [],
      });
    }
  }, [course, form]);

  async function onSubmit(values: CourseEditFormValues) {
    if (!courseRef) return;
    
    // Convert options back to a simple string array
    const dataToUpdate = {
        ...values,
        quiz: values.quiz ? {
            ...values.quiz,
            options: values.quiz.options.map(o => o.value).filter(Boolean)
        } : null,
    };
    
    if (dataToUpdate.quiz?.options.length === 0) {
        dataToUpdate.quiz = null;
    }


    updateDoc(courseRef, dataToUpdate)
    .then(() => {
        toast({
            title: "تم الحفظ بنجاح",
            description: `تم تحديث تفاصيل دورة "${values.title}".`,
        });
    })
    .catch((serverError) => {
        toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: "لم نتمكن من حفظ التغييرات. الرجاء المحاولة مرة أخرى.",
        });
        const permissionError = new FirestorePermissionError({
            path: courseRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!course) {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold">الدورة غير موجودة</h1>
            <p className="text-muted-foreground">لم نتمكن من العثور على الدورة التي تبحث عنها.</p>
            <Button asChild className="mt-4">
                <Link href="/coach-dashboard/courses">العودة إلى الدورات</Link>
            </Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-lg font-semibold md:text-2xl">تحرير محتوى الدورة</h1>
                 <p className="text-muted-foreground">أنت تقوم بتعديل دورة: <span className="font-bold text-primary">{course.title}</span></p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" asChild>
                    <Link href="/coach-dashboard/courses">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        العودة
                    </Link>
                </Button>
                <Button type="submit">
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التغييرات
                </Button>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>محتوى الفيديو</CardTitle>
                <CardDescription>أضف رابط الفيديو الرئيسي للدورة. يمكنك استخدام روابط من يوتيوب أو فيميو.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="videoUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>رابط الفيديو</FormLabel>
                        <FormControl><Input dir="ltr" placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>الاختبار القصير</CardTitle>
                <CardDescription>أنشئ اختبارًا قصيرًا للتحقق من فهم المستفيدين. اتركه فارغًا إذا لم تكن هناك حاجة لاختبار.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="quiz.question" render={({ field }) => (
                    <FormItem>
                        <FormLabel>السؤال</FormLabel>
                        <FormControl><Textarea placeholder="ما هو أهم عنصر في...؟" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <FormField
                    control={form.control}
                    name="quiz.correctAnswer"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>الخيارات (اختر الإجابة الصحيحة)</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col space-y-2"
                            >
                                {fields.map((item, index) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name={`quiz.options.${index}.value`}
                                        render={({ field: optionField }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={optionField.value} />
                                                </FormControl>
                                                <Input {...optionField} placeholder={`الخيار ${index + 1}`} />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })} disabled={fields.length >= 4}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة خيار
                    </Button>
                    <FormDescription>يمكنك إضافة ما يصل إلى 4 خيارات.</FormDescription>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5" />التقييمات</CardTitle>
                <CardDescription>
                    أنشئ تقييمًا قبليًا وبعديًا لقياس مدى تقدم المستفيدين. هذه التقييمات اختيارية.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pre-assessment">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pre-assessment">التقييم القبلي</TabsTrigger>
                        <TabsTrigger value="post-assessment">التقييم البعدي</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pre-assessment" className="pt-4">
                        <AssessmentBuilder
                            control={form.control}
                            name="preAssessment"
                            title="أسئلة التقييم القبلي"
                        />
                    </TabsContent>
                    <TabsContent value="post-assessment" className="pt-4">
                       <AssessmentBuilder
                            control={form.control}
                            name="postAssessment"
                            title="أسئلة التقييم البعدي"
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

      </form>
    </Form>
  );
}
```

---

## File: src/app/coach-dashboard/courses/page.tsx

```tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Download, Edit, Video, Trash2, Check, X, Calendar as CalendarIcon } from "lucide-react";
import Link from 'next/link';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from "@/lib/utils";


type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status?: "منشورة" | "مسودة";
};


const addCourseFormSchema = z.object({
    title: z.string().min(2, { message: "يجب أن يكون العنوان حرفين على الأقل." }),
    category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
    description: z.string().optional(),
});

const addSessionFormSchema = z.object({
  title: z.string().min(3, { message: "عنوان الجلسة مطلوب." }),
  date: z.date({ required_error: "تاريخ الجلسة مطلوب." }),
  duration: z.coerce.number().positive({ message: "المدة يجب أن تكون رقمًا موجبًا."}),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
});


export default function CoachCoursesPage() {
    const { toast } = useToast();
    const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
    const [sessionCourse, setSessionCourse] = useState<Course | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "courses"));
    }, [firestore]);

    const { data: courses, loading } = useCollection<Course>(coursesQuery);

    const addCourseForm = useForm<z.infer<typeof addCourseFormSchema>>({
        resolver: zodResolver(addCourseFormSchema),
        defaultValues: { title: "", category: "", description: "" },
    });
    
    const addSessionForm = useForm<z.infer<typeof addSessionFormSchema>>({
        resolver: zodResolver(addSessionFormSchema),
        defaultValues: {
            meetLink: "",
        },
    });

    async function onAddCourseSubmit(values: z.infer<typeof addCourseFormSchema>) {
        if (!firestore) return;

        const newCourseData = { ...values, status: "مسودة" as const };
        const coursesCollection = collection(firestore, "courses");
        
        addDoc(coursesCollection, newCourseData)
          .then(() => {
              toast({ title: "تم بنجاح!", description: `تمت إضافة دورة "${values.title}" كمسودة.` });
              addCourseForm.reset();
              setIsAddCourseDialogOpen(false);
          })
          .catch((serverError) => {
            const permissionError = new FirestorePermissionError({ path: coursesCollection.path, operation: 'create', requestResourceData: newCourseData });
            errorEmitter.emit('permission-error', permissionError);
             toast({ variant: "destructive", title: "حدث خطأ!", description: "لم نتمكن من إضافة الدورة." });
          });
    }

    async function onAddSessionSubmit(values: z.infer<typeof addSessionFormSchema>) {
      if (!firestore || !sessionCourse || !authUser) return;

      const newSessionData = {
        ...values,
        date: values.date.toISOString(),
        hostId: authUser.uid,
        attendees: [], // Initially empty
        status: "scheduled" as const,
        cost: 0, // Assuming sessions scheduled this way are part of the course
        courseId: sessionCourse.id, // Link to the course
        meetLink: values.meetLink || "",
      }
      
      const sessionsCollection = collection(firestore, "sessions");

      addDoc(sessionsCollection, newSessionData)
        .then(() => {
          toast({ title: "تمت الجدولة!", description: `تمت جدولة جلسة "${values.title}" لدورة "${sessionCourse.title}".`});
          addSessionForm.reset();
          setSessionCourse(null);
        })
        .catch((err) => {
          toast({ variant: "destructive", title: "خطأ!", description: "فشل جدولة الجلسة." });
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionsCollection.path, operation: 'create', requestResourceData: newSessionData }));
        });
    }

    const handleExport = () => {
        toast({ title: "جاري تصدير قائمة الدورات...", description: "سيتم تنزيل ملف CSV قريبًا." });
    }

    async function handlePublish(course: Course) {
        if (!firestore) return;
        const courseRef = doc(firestore, "courses", course.id);
        const newStatus = course.status === "منشورة" ? "مسودة" : "منشورة";
        
        updateDoc(courseRef, { status: newStatus })
        .then(() => {
            toast({
                title: newStatus === "منشورة" ? "تم النشر!" : "تم الإلغاء!",
                description: `تم تحديث حالة دورة "${course.title}".`,
            });
        }).catch((err) => {
             toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية التحديث."});
             const permissionError = new FirestorePermissionError({ path: courseRef.path, operation: 'update', requestResourceData: { status: newStatus } });
             errorEmitter.emit('permission-error', permissionError);
        });
    }

    async function handleDelete() {
        if (!firestore || !courseToDelete) return;
        const courseRef = doc(firestore, "courses", courseToDelete.id);
        
        deleteDoc(courseRef)
        .then(() => {
            toast({ variant: "destructive", title: "تم الحذف!", description: "تم حذف الدورة بنجاح." });
            setCourseToDelete(null);
        }).catch((err) => {
            toast({ variant: "destructive", title: "خطأ!", description: "فشلت عملية الحذف."});
            const permissionError = new FirestorePermissionError({ path: courseRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            setCourseToDelete(null);
        });
    }


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>دوراتي التدريبية</CardTitle>
                <CardDescription>
                إدارة جميع الدورات التدريبية التي قمت بإنشائها.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير
                </Button>
                <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إنشاء دورة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إنشاء دورة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل الدورة الجديدة هنا. انقر على "حفظ" عند الانتهاء.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...addCourseForm}>
                        <form onSubmit={addCourseForm.handleSubmit(onAddCourseSubmit)} className="space-y-4 pt-4">
                            <FormField control={addCourseForm.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input placeholder="مثال: أساسيات البرمجة" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={addCourseForm.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input placeholder="مثال: التكنولوجيا" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={addCourseForm.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>وصف الدورة (اختياري)</FormLabel><FormControl><Textarea placeholder="وصف موجز لمحتوى الدورة..." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                                <Button type="submit">حفظ الدورة</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان الدورة</TableHead>
              <TableHead className="hidden md:table-cell">الفئة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && courses?.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                 <TableCell className="hidden md:table-cell">{course.category || 'غير مصنف'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={course.status === "منشورة" ? "default" : "secondary"}>
                    {course.status || 'مسودة'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                         <Link href={`/coach-dashboard/courses/${course.id}`}>
                            <Edit className="ml-2 h-4 w-4" />
                            تحرير المحتوى
                         </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handlePublish(course)}>
                         {course.status === "منشورة" ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                         {course.status === "منشورة" ? 'إلغاء النشر' : 'نشر الدورة'}
                       </DropdownMenuItem>
                       <DropdownMenuItem onSelect={() => setSessionCourse(course)}>
                            <Video className="ml-2 h-4 w-4" />
                            إضافة جلسة مباشرة
                       </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setCourseToDelete(course); }}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف الدورة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={!!sessionCourse} onOpenChange={(isOpen) => !isOpen && setSessionCourse(null)}>
      <DialogContent dir="rtl" onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) { e.preventDefault(); } }}>
        <DialogHeader>
          <DialogTitle>جدولة جلسة مباشرة</DialogTitle>
          <DialogDescription>إضافة جلسة مباشرة تابعة لدورة "{sessionCourse?.title}".</DialogDescription>
        </DialogHeader>
        <Form {...addSessionForm}>
          <form onSubmit={addSessionForm.handleSubmit(onAddSessionSubmit)} className="space-y-4 pt-4">
            <FormField control={addSessionForm.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>عنوان الجلسة</FormLabel><FormControl><Input placeholder="مثال: أسئلة وأجوبة مباشرة" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={addSessionForm.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                  <Popover><PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر تاريخًا</span>}
                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                  </PopoverContent>
                  </Popover>
                <FormMessage /></FormItem>
              )}/>
              <FormField control={addSessionForm.control} name="duration" render={({ field }) => (
                <FormItem><FormLabel>المدة (بالدقائق)</FormLabel><FormControl><Input type="number" placeholder="60" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
             <FormField
                control={addSessionForm.control}
                name="meetLink"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>رابط Google Meet (اختياري)</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input dir="ltr" placeholder="https://meet.google.com/..." {...field} />
                            </FormControl>
                            <Button type="button" variant="outline" onClick={() => field.onChange(`https://meet.google.com/lookup/${Math.random().toString(36).substring(2, 10)}`)}>
                                إنشاء رابط
                            </Button>
                        </div>
                        <FormDescription>يمكنك لصق رابط أو إنشاء واحد جديد.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button type="submit">جدولة الجلسة</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!courseToDelete} onOpenChange={(isOpen) => !isOpen && setCourseToDelete(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف دورة "{courseToDelete?.title}" نهائيًا من قاعدة البيانات.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>نعم، قم بالحذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
```

---

## File: src/app/coach-dashboard/layout.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Search,
  Settings,
  BookOpen,
  MessageSquare,
  BarChartHorizontal,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useMemo } from "react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  { href: "/coach-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/coach-dashboard/courses", label: "دوراتي", icon: BookOpen },
  { href: "/coach-dashboard/analytics", label: "التحليلات", icon: BarChartHorizontal },
  { href: "/coach-dashboard/messages", label: "الرسائل", icon: MessageSquare },
];


export default function CoachDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-coach',
    name: 'مدرب تجريبي',
    email: 'coach@example.com',
    role: 'coach',
    avatarUrl: `https://picsum.photos/seed/demo-coach/40/40`,
  }), []);

  const userProfile = authUser ? realUserProfile : demoUserProfile;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile.name || 'مدرب';
  const displayEmail = userProfile.email || 'لا يوجد بريد إلكتروني';

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">EmpowerHub</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <div className="p-2 text-center text-sm bg-primary/10 mx-2 rounded-md border border-primary/20">
             <p className="font-semibold text-primary">لوحة تحكم المدرب</p>
           </div>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton asChild tooltip="الإعدادات">
             <Link href="/coach-dashboard/settings">
                <Settings />
                <span>الإعدادات</span>
             </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="بحث..."
                  className="w-full appearance-none bg-background pr-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/coach-dashboard/messages">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">الرسائل</span>
              </Link>
            </Button>
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar>
                  <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount dir="rtl">
              <DropdownMenuLabel className="font-normal text-right">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {authUser ? (
                <>
                  <DropdownMenuItem className="text-right">الملف الشخصي</DropdownMenuItem>
                  <DropdownMenuItem className="text-right">الإعدادات</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-right">
                    تسجيل الخروج
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">
                    تسجيل الدخول
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## File: src/app/coach-dashboard/messages/page.tsx

```tsx
"use client";

import { ChatInterface } from "@/components/chat-interface";

export default function CoachMessagesPage() {
  return (
     <ChatInterface 
      title="مركز رسائل المدرب"
      description="التواصل مع الطلاب المسجلين في دوراتك."
    />
  );
}
```

---

## File: src/app/coach-dashboard/page.tsx

```tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Activity, CheckCircle, DollarSign } from "lucide-react";
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type CoachProfile = UserProfile & {
  wallet?: {
    balance?: number;
  }
};

export default function CoachDashboardPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, loading } = useDoc<CoachProfile>(userRef);
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المدرب</h1>
        <p className="text-muted-foreground">أدواتك لإنشاء محتوى تعليمي مؤثر ومتابعة أداء الطلاب.</p>
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المسجلين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">في جميع دوراتك</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلاب النشطون</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط معدل الإكمال</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">لكل الدورات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-24" /> :
              <div className="text-3xl font-bold">{(user?.wallet?.balance || 0).toFixed(2)} د.أ</div>
            }
          </CardContent>
        </Card>
      </div>
       <div className="grid grid-cols-1 gap-4 pt-4">
        <Card>
            <CardHeader>
                <CardTitle>مرحبا بك في لوحة التحكم</CardTitle>
                <CardDescription>
                هنا يمكنك إدارة دوراتك، متابعة أداء الطلاب، والتواصل معهم لتحقيق أفضل النتائج.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    </>
  );
}
```

---

## File: src/app/coach-dashboard/settings/page.tsx

```tsx
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Save, Wallet } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const payoutSchema = z.object({
  accountHolderName: z.string().min(2, { message: 'يجب أن يكون اسم صاحب الحساب حرفين على الأقل.' }),
  iban: z.string().min(15, { message: 'الرجاء إدخال رقم IBAN صحيح.' }).max(34, { message: 'الرجاء إدخال رقم IBAN صحيح.' }),
  bankName: z.string().min(3, { message: 'يجب أن يكون اسم البنك 3 أحرف على الأقل.' }),
  address: z.string().min(5, { message: 'يجب أن يكون العنوان 5 أحرف على الأقل.' }),
});

type PayoutInfo = z.infer<typeof payoutSchema>;

type CoachProfile = UserProfile & {
  wallet?: {
    balance?: number;
    payoutInfo?: PayoutInfo;
  }
};

export default function CoachSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, loading } = useDoc<CoachProfile>(userRef);

  const form = useForm<PayoutInfo>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      accountHolderName: '',
      iban: '',
      bankName: '',
      address: '',
    },
  });

  useEffect(() => {
    if (user?.wallet?.payoutInfo) {
      form.reset(user.wallet.payoutInfo);
    }
  }, [user, form]);
  

  async function onSubmit(values: PayoutInfo) {
    if (!userRef) return;
    
    updateDoc(userRef, { 'wallet.payoutInfo': values })
        .then(() => {
            toast({
                title: 'تم حفظ الإعدادات',
                description: 'تم تحديث معلومات الدفع الخاصة بك بنجاح.',
            });
        })
        .catch(err => {
            toast({ variant: 'destructive', title: 'خطأ!', description: 'فشلت عملية الحفظ.' });
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { 'wallet.payoutInfo': values } }));
        });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
          <h1 className="text-lg font-semibold md:text-2xl">المحفظة والإعدادات</h1>
          <p className="text-muted-foreground">إدارة أرباحك وتفاصيل الدفع الخاصة بك.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  رصيد الأرباح
              </CardTitle>
              <CardDescription>
                  هذا هو إجمالي أرباحك الحالية من الجلسات التدريبية.
              </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-32" /> :
              <p className="text-3xl font-bold">
                  {(user?.wallet?.balance || 0).toFixed(2)} د.أ
              </p>
            }
              <p className="text-xs text-muted-foreground mt-1">
                  سيتم تحويل الرصيد إلى حسابك البنكي في بداية كل شهر.
              </p>
          </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        معلومات الدفع
                    </CardTitle>
                    <CardDescription>
                        الرجاء إدخال معلومات حسابك البنكي لاستلام أرباحك.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                        <FormItem><FormLabel>اسم صاحب الحساب</FormLabel><FormControl><Input placeholder="الاسم كما هو مسجل في البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="iban" render={({ field }) => (
                        <FormItem><FormLabel>رقم الحساب المصرفي الدولي (IBAN)</FormLabel><FormControl><Input dir="ltr" placeholder="JOXX XXXX XXXX XXXX XXXX XXXX XX" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="bankName" render={({ field }) => (
                        <FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input placeholder="اسم البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>عنوان الفرع</FormLabel><FormControl><Input placeholder="عنوان فرع البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <div>
                <Button type="submit">
                    <Save className="ml-2 h-4 w-4" />
                    حفظ المعلومات
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
```

---

## File: src/app/dashboard/actions.ts

```ts
'use server';

import {
  type PersonalizedEmpowermentRecommendationsOutput,
} from '@/ai/flows/personalized-empowerment-recommendations-flow';

export async function getAiRecommendations(): Promise<
  PersonalizedEmpowermentRecommendationsOutput | { error: string }
> {
  // The AI feature is disabled to ensure successful deployment.
  // We return an error message to be displayed in the UI.
  console.warn(
    'AI recommender feature has been disabled to resolve a deployment issue.'
  );
  return { error: 'ميزة التوصيات غير متاحة حالياً.' };
}
```

---

## File: src/app/dashboard/ai-recommender.tsx

```tsx
"use client";

import { useState } from "react";
import { BookOpen, Bot, Globe, Sparkles, UserCheck } from "lucide-react";

import { getAiRecommendations } from "./actions";
import type { PersonalizedEmpowermentRecommendationsOutput } from "@/ai/flows/personalized-empowerment-recommendations-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Recommendation = PersonalizedEmpowermentRecommendationsOutput["recommendations"][0];

const iconMap = {
  training_module: <BookOpen className="h-5 w-5 text-primary" />,
  external_resource: <Globe className="h-5 w-5 text-accent-foreground" />,
  mentorship_topic: <UserCheck className="h-5 w-5 text-secondary-foreground" />,
};

export function AiRecommender() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);

    const result = await getAiRecommendations();

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: result.error,
      });
    } else {
      setRecommendations(result.recommendations);
    }
    setIsLoading(false);
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
           <Sparkles className="h-6 w-6 text-primary" />
           <CardTitle>توصيات مدعومة بالذكاء الاصطناعي</CardTitle>
        </div>
        <CardDescription>
          احصل على اقتراحات مخصصة لتسريع نموك.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingState />}
        {!isLoading && !recommendations && <InitialState onClick={handleGetRecommendations} />}
        {!isLoading && recommendations && <RecommendationsList recommendations={recommendations} />}
      </CardContent>
    </Card>
  );
}

function InitialState({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center p-6 border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
      <div className="bg-primary/10 p-3 rounded-full">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold">هل أنت مستعد لاتخاذ خطوتك التالية؟</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        سيقوم مدربنا الذكي بتحليل تقدمك وأهدافك ليوصي بالموارد الأكثر تأثيرًا لك.
      </p>
      <Button onClick={onClick}>
        <Sparkles className="mr-2 h-4 w-4" />
        أنشئ مساري
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div key={rec.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="bg-muted p-2.5 rounded-full">
            {iconMap[rec.type]}
          </div>
          <div>
            <h4 className="font-semibold">{rec.title}</h4>
            <p className="text-sm text-muted-foreground">{rec.description}</p>
            {rec.link && (
              <a href={rec.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 inline-block">
                عرض المصدر &rarr;
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## File: src/app/dashboard/contact/page.tsx

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Building } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";

const contactFormSchema = z.object({
  subject: z.string({ required_error: "الرجاء اختيار الموضوع." }),
  message: z.string().min(10, { message: "الرسالة يجب أن تحتوي على 10 أحرف على الأقل." }),
});

export default function ContactOrganizationPage() {
  const { toast } = useToast();
  const { userProfile } = useUser();

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { subject: undefined, message: "" },
  });

  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    console.log("Submitting request to organization:", values);
    toast({
        title: "تم إرسال طلبك بنجاح",
        description: `سيتم مراجعة طلبك بخصوص "${values.subject}" من قبل مدير منظمتك.`,
    });
    form.reset();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            التواصل مع المنظمة
          </CardTitle>
          <CardDescription>
            استخدم هذا النموذج لطلب تدريب أو إرشاد، أو لإرسال أي استفسار آخر إلى مدير منظمتك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموضوع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الطلب..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="طلب تدريب جديد">طلب تدريب جديد</SelectItem>
                        <SelectItem value="طلب جلسة إرشاد">طلب جلسة إرشاد</SelectItem>
                        <SelectItem value="استفسار عام">استفسار عام</SelectItem>
                        <SelectItem value="مشكلة فنية">مشكلة فنية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرسالة</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اشرح طلبك بالتفصيل هنا..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Send className="ml-2 h-4 w-4" />
                إرسال الطلب
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## File: src/app/dashboard/layout.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  LayoutGrid,
  Search,
  Settings,
  Store,
  Users,
  BarChart3,
  ChevronDown,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useMemo } from "react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/dashboard/training", label: "التدريب", icon: BookOpen },
  { href: "/dashboard/mentorship", label: "الإرشاد", icon: Users },
  { href: "/dashboard/my-store", label: "متجري", icon: Store },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/messages", label: "الرسائل", icon: MessageSquare },
  { href: "/dashboard/contact", label: "التواصل مع المنظمة", icon: HelpCircle },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-beneficiary',
    name: 'مستفيد تجريبي',
    email: 'beneficiary@example.com',
    role: 'beneficiary',
    avatarUrl: `https://picsum.photos/seed/demo-beneficiary/40/40`,
  }), []);

  const userProfile = authUser ? realUserProfile : demoUserProfile;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
        </div>
      </div>
    );
  }
  
  const displayName = userProfile.name || 'مستفيد';
  const displayEmail = userProfile.email || 'لا يوجد بريد إلكتروني';

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">EmpowerHub</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton asChild tooltip="الإعدادات">
             <Link href="/dashboard/settings">
                <Settings />
                <span>الإعدادات</span>
             </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="بحث..."
                  className="w-full appearance-none bg-background pr-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/dashboard/messages">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">الرسائل</span>
              </Link>
            </Button>
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar>
                  <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount dir="rtl">
              <DropdownMenuLabel className="font-normal text-right">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {authUser ? (
                <>
                  <DropdownMenuItem className="text-right">الملف الشخصي</DropdownMenuItem>
                  <DropdownMenuItem className="text-right">الفواتير</DropdownMenuItem>
                  <DropdownMenuItem className="text-right">الإعدادات</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-right">
                    تسجيل الخروج
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">
                    تسجيل الدخول
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## File: src/app/dashboard/mentorship/page.tsx

```tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, User, Star } from "lucide-react";
import { useState, useMemo } from "react";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { EvaluationDialog } from "@/components/evaluation-dialog";

type Session = {
    id: string;
    title: string;
    date: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    meetLink?: string;
    notes?: string;
};

type EvaluationTarget = {
    sessionId: string;
    evaluatedId: string;
    evaluatedName: string;
};

export default function MentorshipPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const { user: authUser, userProfile: beneficiaryProfile } = useUser();
  const firestore = useFirestore();
  const [evaluationTarget, setEvaluationTarget] = useState<EvaluationTarget | null>(null);

  const mentorRef = useMemoFirebase(() => {
    if (!firestore || !beneficiaryProfile?.mentorId) return null;
    return doc(firestore, 'users', beneficiaryProfile.mentorId);
  }, [firestore, beneficiaryProfile?.mentorId]);

  const { data: mentor, loading: mentorLoading } = useDoc<UserProfile>(mentorRef);

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "sessions"), where("attendees", "array-contains", authUser.uid));
  }, [firestore, authUser]);

  const { data: sessions, loading: sessionsLoading } = useCollection<Session>(sessionsQuery);
  
  const loading = mentorLoading || sessionsLoading;

  const { upcomingSessions, pastSessions } = useMemo(() => {
    if (!sessions) return { upcomingSessions: [], pastSessions: [] };
    const upcoming: Session[] = [];
    const past: Session[] = [];
    sessions.forEach(s => {
      if (s.status !== 'cancelled' && !isPast(parseISO(s.date))) {
        upcoming.push(s);
      } else {
        past.push(s);
      }
    });
    return { 
        upcomingSessions: upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
        pastSessions: past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
    };
  }, [sessions]);


  const handleSendMessage = () => {
    if (message.trim() === "") {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "لا يمكن إرسال رسالة فارغة.",
        });
        return;
    }
    console.log("Sending message:", message);
    toast({
        title: "تم الإرسال!",
        description: "تم إرسال رسالتك إلى مرشدك بنجاح.",
    });
    setMessage("");
  };

  const handleEvaluationClick = (session: Session) => {
    if (!mentor) return;
    setEvaluationTarget({
      sessionId: session.id,
      evaluatedId: mentor.id,
      evaluatedName: mentor.name || 'المرشد',
    });
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
         <Card>
            <CardHeader>
                <CardTitle>الجلسات القادمة</CardTitle>
                <CardDescription>استعد لجلسات الإرشاد القادمة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading && <Skeleton className="h-20 w-full" />}
                {!loading && upcomingSessions.length === 0 && <p className="text-muted-foreground text-center p-4">لا توجد جلسات قادمة.</p>}
                {!loading && upcomingSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                            <p className="font-semibold">{session.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(parseISO(session.date), "p", { locale: ar })}</span>
                            </div>
                        </div>
                        <Button asChild>
                            <a href={session.meetLink || "https://meet.google.com"} target="_blank" rel="noopener noreferrer">
                                <Video className="ml-2 h-4 w-4" />
                                انضم للجلسة
                            </a>
                        </Button>
                    </div>
                ))}
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
                <CardTitle>الجلسات السابقة</CardTitle>
                 <CardDescription>مراجعة ملاحظات الجلسات السابقة وتقييمها.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading && <Skeleton className="h-24 w-full" />}
                {!loading && pastSessions.length === 0 && <p className="text-muted-foreground text-center p-4">لا توجد جلسات سابقة.</p>}
                {!loading && pastSessions.map(session => (
                    <div key={session.id} className="p-3 border-b flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{session.title} <span className="text-sm text-muted-foreground font-normal">- {format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span></p>
                            <p className="text-sm text-muted-foreground mt-1">{session.notes || "لا توجد ملاحظات."}</p>
                        </div>
                        {session.status === 'completed' && (
                            <Button variant="outline" size="sm" onClick={() => handleEvaluationClick(session)}>
                                <Star className="ml-2 h-4 w-4" />
                                تقييم الجلسة
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
         </Card>
      </div>

      <div className="space-y-6">
        {loading ? (
             <Card>
                <CardHeader className="items-center text-center">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="pt-2 w-full space-y-2">
                        <Skeleton className="h-6 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                </CardHeader>
            </Card>
        ) : mentor ? (
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="w-24 h-24 border-4 border-primary">
                        <AvatarImage src={mentor.avatarUrl || `https://picsum.photos/seed/${mentor.id}/100/100`} />
                        <AvatarFallback>{mentor.name?.charAt(0) || 'M'}</AvatarFallback>
                    </Avatar>
                    <div className="pt-2">
                        <CardTitle>المرشد: {mentor.name || 'مرشد بلا اسم'}</CardTitle>
                        <CardDescription>{mentor.expertise || "خبير في مجاله"}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">"مهمتي هي مساعدتك على تحقيق أهدافك وتحويل فكرتك إلى مشروع ناجح. لا تتردد في طرح أي سؤال."</p>
                </CardContent>
            </Card>
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle>لم يتم تعيين مرشد</CardTitle>
                    <CardDescription>تواصل مع مدير منظمتك لتعيين مرشد لك.</CardDescription>
                </CardHeader>
            </Card>
        )}
        <Card>
            <CardHeader>
                <CardTitle>أرسل رسالة لمرشدك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    placeholder="اكتب رسالتك هنا..." 
                    className="min-h-[120px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!mentor}
                />
                <Button className="w-full" onClick={handleSendMessage} disabled={!mentor}>إرسال</Button>
            </CardContent>
        </Card>
      </div>
    </div>
    {evaluationTarget && authUser && (
        <EvaluationDialog
            isOpen={!!evaluationTarget}
            onOpenChange={(isOpen) => !isOpen && setEvaluationTarget(null)}
            sessionId={evaluationTarget.sessionId}
            evaluatorId={authUser.uid}
            evaluatedId={evaluationTarget.evaluatedId}
            evaluatedName={evaluationTarget.evaluatedName}
            type="beneficiary_to_mentor"
        />
    )}
    </>
  );
}
```

---

## File: src/app/dashboard/messages/page.tsx

```tsx
"use client";

import { ChatInterface } from "@/components/chat-interface";

export default function BeneficiaryMessagesPage() {
  return (
     <ChatInterface 
      title="مركز الرسائل"
      description="التواصل مع مرشدك ومدير منظمتك."
    />
  );
}
```

---

## File: src/app/dashboard/my-store/page.tsx

```tsx

"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package, DollarSign, Users, ShoppingCart, PlusCircle, MoreVertical, MapPin, Trash2, Edit, Upload, Settings, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, addDoc, doc, updateDoc, deleteDoc, orderBy, Timestamp } from "firebase/firestore";
import { useFirestore, useMemoFirebase, useStorage } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, { message: "يجب أن يكون اسم المنتج حرفين على الأقل." }),
    description: z.string().min(10, { message: "يجب أن يكون الوصف 10 أحرف على الأقل." }).optional(),
    location: z.string().min(2, { message: "يجب أن يكون الموقع حرفين على الأقل." }).optional(),
    price: z.coerce.number().positive({ message: "يجب أن يكون السعر رقمًا موجبًا." }),
    stock: z.coerce.number().int().min(0, { message: "يجب أن يكون المخزون رقمًا صحيحًا." }),
    deliveryCost: z.coerce.number().min(0, { message: "يجب أن تكون تكلفة التوصيل 0 أو أكثر." }).optional(),
    imageUrl: z.string().optional(),
    beneficiaryId: z.string(),
    beneficiaryName: z.string(),
    category: z.string().optional(),
});

type Product = z.infer<typeof formSchema>;
type Order = {
    id: string;
    productName: string;
    customerName: string;
    orderDate?: Timestamp;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
};

const statusMap: { [key in Order['status']]: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
    pending: { text: "قيد الانتظار", variant: "secondary" },
    shipped: { text: "تم الشحن", variant: "default" },
    delivered: { text: "تم التوصيل", variant: "outline" },
    cancelled: { text: "ملغي", variant: "destructive" },
};


export default function MyStorePage() {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const firestore = useFirestore();
    const storage = useStorage();
    const { user: authUser, userProfile } = useUser();

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, "products"), where("beneficiaryId", "==", authUser.uid));
    }, [firestore, authUser]);
    
    const { data: products, loading: productsLoading } = useCollection<Product>(productsQuery);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, "orders"), where("beneficiaryId", "==", authUser.uid), orderBy("orderDate", "desc"));
    }, [firestore, authUser]);

    const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);

    const loading = productsLoading || ordersLoading;
    
    const storeStats = useMemo(() => {
        if (!products) {
            return { totalProducts: 0, totalRevenue: "0.00", totalOrders: "+0", newCustomers: "+0" };
        }
        const totalProductsCount = products.length;
        const totalRevenue = products.reduce((acc, p) => acc + (p.price || 0), 0); // Mock revenue calc for demo
        const totalOrders = orders?.length || 0;
        const newCustomers = new Set(orders?.map(o => o.customerName)).size || 0;

        return {
            totalProducts: totalProductsCount,
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders: `${totalOrders}`,
            newCustomers: `${newCustomers}`
        }
    }, [products, orders]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const openDialogForEdit = (product: Product) => {
        setEditProduct(product);
        form.reset(product);
        setImagePreview(product.imageUrl || null);
        setImageFile(null);
        setIsDialogOpen(true);
    };

    const openDialogForAdd = () => {
        if (!authUser || !userProfile) {
            toast({variant: "destructive", title: "خطأ", description: "يجب تسجيل الدخول لإضافة منتج."});
            return;
        }
        setEditProduct(null);
        form.reset({
            name: "", price: 0, stock: 0, description: "", location: "الرياض",
            deliveryCost: 2.5,
            imageUrl: "",
            beneficiaryId: authUser.uid,
            beneficiaryName: userProfile.name,
            category: "مجوهرات",
        });
        setImagePreview(null);
        setImageFile(null);
        setIsDialogOpen(true);
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore || !storage || !authUser) return;
        setIsUploading(true);

        let finalImageUrl = editProduct?.imageUrl || "";

        if (imageFile) {
            const uniqueFileName = `${authUser.uid}/${Date.now()}-${imageFile.name}`;
            const imageRef = storageRef(storage, `product-images/${uniqueFileName}`);
            
            try {
                const snapshot = await uploadBytes(imageRef, imageFile);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Error uploading image:", error);
                toast({
                    variant: "destructive",
                    title: "خطأ في رفع الصورة",
                    description: "لم نتمكن من رفع صورة المنتج. الرجاء المحاولة مرة أخرى.",
                });
                setIsUploading(false);
                return;
            }
        }
        
        const productData = { ...values, imageUrl: finalImageUrl };

        const productsCollection = collection(firestore, "products");

        if (editProduct && editProduct.id) {
            const productRef = doc(firestore, 'products', editProduct.id);
            updateDoc(productRef, productData)
                .then(() => {
                    toast({ title: "تم التعديل بنجاح!", description: `تم تحديث منتج "${values.name}".` });
                })
                .catch(err => {
                    toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث المنتج." });
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: productRef.path, operation: 'update', requestResourceData: productData }));
                });
        } else {
            addDoc(productsCollection, productData)
                .then(() => {
                    toast({ title: "تمت الإضافة بنجاح!", description: `تمت إضافة منتج "${values.name}" إلى متجرك.` });
                })
                .catch(err => {
                    toast({ variant: "destructive", title: "خطأ", description: "فشل إضافة المنتج." });
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: productsCollection.path, operation: 'create', requestResourceData: productData }));
                });
        }

        form.reset();
        setIsDialogOpen(false);
        setEditProduct(null);
        setImagePreview(null);
        setImageFile(null);
        setIsUploading(false);
    }
    
    async function handleDelete() {
        if (!productToDelete || !productToDelete.id || !firestore) return;
        const productRef = doc(firestore, 'products', productToDelete.id);
        deleteDoc(productRef)
            .then(() => {
                toast({ variant: "destructive", title: "تم الحذف!", description: `تم حذف المنتج "${productToDelete.name}".`});
                setProductToDelete(null);
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المنتج." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: productRef.path, operation: 'delete' }));
                setProductToDelete(null);
            });
    }

    const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', orderId);
        try {
            await updateDoc(orderRef, { status });
            toast({
                title: "تم تحديث حالة الطلب",
                description: `تم تحديث الطلب بنجاح إلى "${statusMap[status].text}".`
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "فشل تحديث حالة الطلب."
            });
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: orderRef.path,
                operation: 'update',
                requestResourceData: { status }
            }));
        }
    };

  return (
    <>
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">لوحة تحكم متجري</h1>
        <p className="text-muted-foreground">
          نظرة عامة على أداء متجرك الإلكتروني.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storeStats.totalRevenue} د.أ</div>
            <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storeStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">منتج معروض في المتجر</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storeStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">إجمالي الطلبات المستلمة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storeStats.newCustomers}</div>
            <p className="text-xs text-muted-foreground">إجمالي عدد العملاء</p>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">منتجاتك</h2>
                <p className="text-muted-foreground">
                إدارة منتجات متجرك.
                </p>
            </div>
             <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href="/dashboard/my-store/settings">
                        <Settings className="ml-2 h-4 w-4" />
                        إعدادات المتجر
                    </Link>
                </Button>
                <Button onClick={openDialogForAdd}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة منتج جديد
                </Button>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {productsLoading && [...Array(3)].map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-[300px]" /></CardContent></Card>
            ))}
            {!productsLoading && products?.map((product) => (
                <Card key={product.id} className="group flex flex-col">
                    <CardHeader className="p-0 relative">
                         <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} width={400} height={300} className="rounded-t-lg object-cover" />
                         <div className="absolute top-2 left-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" dir="rtl">
                                    <DropdownMenuItem onClick={() => openDialogForEdit(product)}>
                                        <Edit className="ml-2 h-4 w-4" />
                                        تعديل المنتج
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-500" onSelect={() => setProductToDelete(product)}>
                                        <Trash2 className="ml-2 h-4 w-4" />
                                        حذف المنتج
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-[40px]">{product.description}</p>
                        <p className="text-sm text-muted-foreground mt-2">المخزون: {product.stock} قطعة</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center p-4 pt-0">
                        <div>
                            <p className="text-lg font-semibold">{product.price.toFixed(2)} د.أ</p>
                            {product.deliveryCost && product.deliveryCost > 0 && (
                                <p className="text-xs text-muted-foreground">+ {product.deliveryCost.toFixed(2)} د.أ توصيل</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {product.location || 'غير محدد'}
                        </div>
                    </CardFooter>
                </Card>
            ))}
             {!productsLoading && (!products || products.length === 0) && (
                <div className="col-span-full text-center h-40 flex items-center justify-center">
                    <p>لم تقم بإضافة أي منتجات بعد. انقر على "إضافة منتج جديد" للبدء.</p>
                </div>
            )}
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>الطلبات الواردة</CardTitle>
            <CardDescription>إدارة الطلبات الجديدة على منتجاتك.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>المنتج</TableHead>
                        <TableHead>الزبون</TableHead>
                        <TableHead>تاريخ الطلب</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-right"><span className="sr-only">الإجراءات</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ordersLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">جاري تحميل الطلبات...</TableCell></TableRow>}
                    {!ordersLoading && orders && orders.length > 0 ? orders.map(order => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.productName}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.orderDate && typeof order.orderDate.toDate === 'function' ? format(order.orderDate.toDate(), "d MMMM yyyy", { locale: ar }) : 'غير محدد'}</TableCell>
                            <TableCell>
                                <Badge variant={statusMap[order.status].variant} className={order.status === 'delivered' ? 'text-green-600 border-green-600' : ''}>
                                    {statusMap[order.status].text}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" dir="rtl">
                                        <DropdownMenuLabel>تغيير الحالة</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}>
                                            <Truck className="ml-2 h-4 w-4" />
                                            تمييز كـ تم الشحن
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>
                                            <CheckCircle className="ml-2 h-4 w-4" />
                                            تمييز كـ تم التوصيل
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>
                                            <XCircle className="ml-2 h-4 w-4" />
                                            إلغاء الطلب
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : null}
                    {!ordersLoading && (!orders || orders.length === 0) && (
                        <TableRow><TableCell colSpan={5} className="text-center h-24">لا توجد طلبات حالية.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
    </div>
    
    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen)
        if (!isOpen) {
            setEditProduct(null);
            setImagePreview(null);
            setImageFile(null);
            form.reset();
        }
    }}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
            <DialogTitle>{editProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
            <DialogDescription>
            {editProduct ? 'قم بتحديث تفاصيل المنتج.' : 'أدخل تفاصيل المنتج الجديد.'}
            </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto px-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>اسم المنتج</FormLabel><FormControl><Input placeholder="مثال: خاتم فضة" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>وصف المنتج</FormLabel><FormControl><Textarea placeholder="وصف موجز للمنتج ومميزاته..." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormItem>
                    <FormLabel>صورة المنتج</FormLabel>
                    <FormControl>
                        <Input
                            type="file"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleImageChange}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                {imagePreview && (
                    <div>
                        <FormLabel>معاينة الصورة</FormLabel>
                        <div className="mt-2">
                            <Image src={imagePreview} alt="معاينة" width={100} height={100} className="rounded-md object-cover border" />
                        </div>
                    </div>
                )}
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>الموقع (المدينة)</FormLabel><FormControl><Input placeholder="مثال: الرياض" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>السعر (د.أ)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="150.00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="deliveryCost" render={({ field }) => (
                        <FormItem><FormLabel>تكلفة التوصيل (د.أ)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="3.00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem><FormLabel>الكمية في المخزون</FormLabel><FormControl><Input type="number" placeholder="25" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <DialogFooter className="sticky bottom-0 bg-background pt-4">
                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                    <Button type="submit" disabled={isUploading}>{isUploading ? 'جاري الحفظ...' : editProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}</Button>
                </DialogFooter>
            </form>
        </Form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء سيقوم بحذف المنتج "{productToDelete?.name}" نهائيًا من متجرك.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>نعم، قم بالحذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
```

---

## File: src/app/dashboard/my-store/settings/page.tsx

```tsx
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
import { Save, Building, Facebook, Instagram, Twitter } from "lucide-react";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const storeSettingsSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون اسم المتجر حرفين على الأقل." }),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  phone: z.string().optional(),
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

  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      location: "",
      phone: "",
      socials: { facebook: "", instagram: "", twitter: "" },
    },
  });

  useEffect(() => {
    async function fetchStoreData() {
      if (!firestore || !authUser) {
        setLoading(false);
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
          if (data.logoUrl) {
            setLogoPreview(data.logoUrl);
          }
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
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: StoreSettingsFormValues) {
    if (!firestore || !storage || !authUser || !userProfile) return;
    
    setIsSaving(true);
    let finalLogoUrl = storeDoc?.logoUrl || "";

    try {
      if (logoFile) {
        const uniqueFileName = `${authUser.uid}/${Date.now()}-${logoFile.name}`;
        const imageRef = storageRef(storage, `store-logos/${uniqueFileName}`);
        const snapshot = await uploadBytes(imageRef, logoFile);
        finalLogoUrl = await getDownloadURL(snapshot.ref);
      }

      const storeData = { 
        ...values, 
        logoUrl: finalLogoUrl,
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
```

---

## File: src/app/dashboard/page.tsx

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, BookOpenCheck, DollarSign } from "lucide-react";
import { AiRecommender } from "./ai-recommender";

export default function DashboardPage() {
  return (
    <>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground">مرحباً بعودتك! هنا يمكنك متابعة تقدمك والحصول على توصيات مخصصة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
            <AiRecommender />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الدورات قيد التقدم</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">من أصل 4 دورات معينة</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الشهادات المكتملة</CardTitle>
                <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">+1 هذا الشهر</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إيرادات المتجر</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.00 د.أ</div>
                <p className="text-xs text-muted-foreground">لا توجد مبيعات بعد</p>
              </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
```

---

## File: src/app/dashboard/reports/page.tsx

```tsx

"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, DollarSign, BookOpenCheck, ShoppingCart } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface RevenueData {
  date: string;
  revenue: number;
}

interface ProgressData {
  name: string;
  "التقدم": number;
}

interface SalesByCategoryData {
  name: string;
  value: number;
  fill: string;
}

const revenueConfig = {
  revenue: { label: "الإيرادات", color: "hsl(var(--chart-1))" },
}
const progressConfig = {
  "التقدم": { label: "التقدم", color: "hsl(var(--chart-2))" },
}
const salesByCategoryConfig = {
  jewelry: { label: "مجوهرات" },
  decor: { label: "ديكور منزلي" },
  apparel: { label: "ملابس" },
}

export default function ReportsPage() {
    const { toast } = useToast();
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        summary: true,
        revenue: true,
        progress: true,
        salesCategory: true,
    });
    
    // Data is reset for production. In a real app, this would be fetched from the backend.
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [progressData, setProgressData] = useState<ProgressData[]>([]);
    const [salesByCategoryData, setSalesByCategoryData] = useState<SalesByCategoryData[]>([]);

    const handleExport = (fullReport: boolean = false) => {
        const selectedReports = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions)
            .filter(([, isSelected]) => isSelected)
            .map(([reportName]) => reportName);

        if (selectedReports.length === 0) {
            toast({
                variant: "destructive",
                title: "لم يتم تحديد أي أجزاء",
                description: "الرجاء تحديد جزء واحد على الأقل من التقرير لتصديره.",
            });
            return;
        }

        toast({
        title: "جاري تصدير التقرير...",
        description: `سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.`,
        });
        setIsExportDialogOpen(false);
    }
    const handleCheckboxChange = (key: keyof typeof exportOptions) => {
        setExportOptions(prev => ({...prev, [key]: !prev[key]}));
    }

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">التقارير والتحليلات</h1>
                <p className="text-muted-foreground">نظرة عميقة على أدائك وتأثيرك.</p>
            </div>
             <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Download className="ml-2 h-4 w-4" />
                        تصدير التقارير
                    </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تصدير التقارير والتحليلات</DialogTitle>
                        <DialogDescription>اختر أجزاء التقرير التي ترغب في تصديرها.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="font-medium">أجزاء التقرير</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="summary" checked={exportOptions.summary} onCheckedChange={() => handleCheckboxChange("summary")} />
                                <Label htmlFor="summary">الملخص الإحصائي</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="revenue" checked={exportOptions.revenue} onCheckedChange={() => handleCheckboxChange("revenue")} />
                                <Label htmlFor="revenue">إيرادات المتجر</Label>
                            </div>
                             <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="progress" checked={exportOptions.progress} onCheckedChange={() => handleCheckboxChange("progress")} />
                                <Label htmlFor="progress">تقدم المسار التعليمي</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="salesCategory" checked={exportOptions.salesCategory} onCheckedChange={() => handleCheckboxChange("salesCategory")} />
                                <Label htmlFor="salesCategory">المبيعات حسب الفئة</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                        <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
                        <Button onClick={() => handleExport(true)}>تصدير التقرير الكامل</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
      </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي إيرادات المتجر</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0.00 د.أ</div>
                    <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الدورات المكتملة</CardTitle>
                    <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">من أصل 0 دورات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المنتج الأكثر مبيعاً</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold">-</div>
                    <p className="text-xs text-muted-foreground">0 قطعة مباعة</p>
                </CardContent>
            </Card>
        </div>


       <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>إيرادات المتجر الشهرية</CardTitle>
                    <CardDescription>إجمالي الإيرادات من متجرك على مدار الأشهر الستة الماضية.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={revenueConfig} className="h-[250px] w-full relative">
                        {revenueData.length === 0 ? (
                             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <LineChart accessibilityLayer data={revenueData} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value} د.أ`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                            </LineChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>تقدم المسار التعليمي</CardTitle>
                    <CardDescription>التقدم المحرز في الفئات الرئيسية لمسارك التعليمي.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
                        {progressData.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <BarChart accessibilityLayer data={progressData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                                <XAxis type="number" dataKey="التقدم" orientation="top" tickFormatter={(value) => `${value}%`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="التقدم" fill="var(--color-التقدم)" radius={5} />
                            </BarChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
       </div>
       <Card>
            <CardHeader>
                <CardTitle>مبيعات المتجر حسب الفئة</CardTitle>
                <CardDescription>توزيع إيرادات المتجر على فئات المنتجات المختلفة.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={salesByCategoryConfig} className="h-[250px] w-full relative">
                    {salesByCategoryData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                    ) : (
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={salesByCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} >
                                {salesByCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend/>
                        </PieChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
```

---

## File: src/app/dashboard/settings/page.tsx

```tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          الإعدادات
        </h1>
        <p className="text-sm text-muted-foreground">
          إدارة إعدادات حسابك وتفضيلاتك هنا.
        </p>
      </div>
    </div>
  );
}
```

---

## File: src/app/dashboard/training/[courseId]/page.tsx

```tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Film, HelpCircle, Users, ArrowRight, Star, BookCheck, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type AssessmentQuestion = {
    question: string;
    type: 'rating' | 'text';
};

type Course = {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: string;
  },
  preAssessment?: AssessmentQuestion[];
  postAssessment?: AssessmentQuestion[];
};

const quizSchema = z.object({
    answer: z.string({
        required_error: "الرجاء اختيار إجابة.",
    }),
});

const AssessmentViewer = ({ title, questions }: { title: string, questions: AssessmentQuestion[] }) => {
    const { toast } = useToast();
    const handleSubmit = () => {
        // Here you would save the assessment answers to Firestore
        toast({
            title: "تم إرسال التقييم",
            description: "شكرًا لمشاركتك، تم حفظ إجاباتك بنجاح.",
        });
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookCheck className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>
                    الرجاء الإجابة على الأسئلة التالية بصدق لمساعدتنا على فهم احتياجاتك وقياس مدى تقدمك.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {questions.map((q, index) => (
                    <div key={index}>
                        <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                        {q.type === 'rating' && (
                            <div className="flex gap-1" dir="ltr">
                                {[1,2,3,4,5].map(star => (
                                    <Star key={star} className="h-7 w-7 text-gray-300 cursor-pointer hover:text-yellow-400" />
                                ))}
                            </div>
                        )}
                        {q.type === 'text' && (
                            <Textarea placeholder="اكتب إجابتك هنا..." />
                        )}
                    </div>
                ))}
                 <Button onClick={handleSubmit}>
                    <ThumbsUp className="ml-2 h-4 w-4" />
                    إرسال التقييم
                </Button>
            </CardContent>
        </Card>
    );
};


export default function CourseDetailsPage({ params }: { params: { courseId: string } }) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const courseRef = useMemoFirebase(() => {
        if (!firestore || !params.courseId) return null;
        return doc(firestore, "courses", params.courseId);
    }, [firestore, params.courseId]);

    const { data: courseData, loading } = useDoc<Course>(courseRef);

    const form = useForm<z.infer<typeof quizSchema>>({
        resolver: zodResolver(quizSchema),
    });

    function onSubmit(values: z.infer<typeof quizSchema>) {
        if (!courseData?.quiz) return;
        
        const isCorrect = values.answer === courseData.quiz.correctAnswer;
        toast({
            title: isCorrect ? "إجابة صحيحة!" : "إجابة خاطئة",
            description: isCorrect ? "أحسنت! لقد فهمت المفهوم جيدًا. سيتم تحديث تقدمك." : `حاول مرة أخرى. الجواب الصحيح هو: ${courseData.quiz.correctAnswer}`,
            variant: isCorrect ? "default" : "destructive",
        });

        if (isCorrect) {
            // In a real app, you would update the user's progress in the database.
            // For example: updateDoc(userProgressRef, { [courseId]: 'completed' });
        }
    }

    const handleBookSession = () => {
        toast({
            title: "تم إرسال طلبك",
            description: "تم إرسال طلبك لحجز جلسة فردية مع المدرب. سيتم التواصل معك للتأكيد.",
        });
    }

    if (loading) {
        return (
            <div className="space-y-8 max-w-4xl mx-auto">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                    <CardContent><Skeleton className="aspect-video w-full" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                    <CardContent><Skeleton className="h-10 w-40" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-10 w-40 mt-4" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!courseData) {
        return (
             <div className="text-center">
                <h1 className="text-2xl font-bold">الدورة غير موجودة</h1>
                <p className="text-muted-foreground">لم نتمكن من العثور على الدورة التي تبحث عنها.</p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard/training">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        العودة إلى قائمة الدورات
                    </Link>
                </Button>
            </div>
        )
    }

    // Convert youtube watch url to embed url
    const videoEmbedUrl = courseData.videoUrl?.includes("watch?v=") 
        ? courseData.videoUrl.replace("watch?v=", "embed/") 
        : courseData.videoUrl;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{courseData.title}</h1>
                <p className="text-lg text-muted-foreground mt-2">{courseData.description}</p>
            </div>

            {courseData.preAssessment && courseData.preAssessment.length > 0 && (
                <AssessmentViewer title="تقييم قبلي" questions={courseData.preAssessment} />
            )}


            {videoEmbedUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Film className="h-5 w-5" />
                            محتوى الفيديو
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video">
                            <iframe
                                className="w-full h-full rounded-lg"
                                src={videoEmbedUrl}
                                title="Course video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        جلسات فردية مع المدرب
                    </CardTitle>
                    <CardDescription>
                        هل تحتاج إلى مساعدة إضافية؟ احجز جلسة فردية (1-to-1) مع مدرب الدورة لمناقشة استفساراتك والحصول على إرشادات مخصصة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleBookSession}>
                        حجز جلسة 1-to-1
                    </Button>
                </CardContent>
            </Card>

            {courseData.quiz?.question && courseData.quiz?.options && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5" />
                            اختبار قصير
                        </CardTitle>
                        <CardDescription>{courseData.quiz.question}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="answer"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                {courseData.quiz?.options.map(option => (
                                                    <FormItem key={option} className="flex items-center space-x-3 space-x-reverse">
                                                        <FormControl>
                                                            <RadioGroupItem value={option} />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            {option}
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">
                                    <CheckCircle className="ml-2 h-4 w-4"/>
                                    تحقق من الإجابة
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}

             {courseData.postAssessment && courseData.postAssessment.length > 0 && (
                <AssessmentViewer title="تقييم بعدي" questions={courseData.postAssessment} />
            )}

            <div className="text-center">
                 <Button variant="outline" asChild>
                    <Link href="/dashboard/training">
                         <ArrowRight className="ml-2 h-4 w-4" />
                        العودة إلى قائمة الدورات
                    </Link>
                </Button>
            </div>
        </div>
    );
}
```

---

## File: src/app/dashboard/training/page.tsx

```tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookMarked, PlayCircle, BookHeart } from "lucide-react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";

type Course = {
    id: string;
    title: string;
    description?: string;
    category?: string;
    status: "منشورة" | "مسودة";
};

const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <div className="col-span-full flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
            <BookHeart className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">{description}</p>
    </div>
);


export default function TrainingPage() {
    const firestore = useFirestore();

    // In a real app, this would also filter by courses assigned to the user
    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "courses"), where("status", "==", "منشورة"));
    }, [firestore]);

    const { data: courses, loading } = useCollection<Course>(coursesQuery);

    // In a real app, this data would be fetched for the user. For now, it's reset.
    const courseProgress: { [key: string]: number } = {};
    
    const inProgressCourses = courses?.filter(c => (courseProgress[c.id] || 0) < 100 && (courseProgress[c.id] || 0) > 0) || [];
    const notStartedCourses = courses?.filter(c => (courseProgress[c.id] || 0) === 0) || [];
    const completedCourses = courses?.filter(c => (courseProgress[c.id] || 0) === 100) || [];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الدورات التدريبية</h1>
        <p className="text-muted-foreground">
          الدورات المتاحة لك.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {loading && [...Array(2)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
                    <CardContent><Skeleton className="h-6 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
            {[...inProgressCourses, ...notStartedCourses].map((course) => {
                const progress = courseProgress[course.id] || 0;
                return (
                    <Card key={course.id}>
                        <CardHeader>
                            <CardTitle>{course.title}</CardTitle>
                            <CardDescription>{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-muted-foreground">{progress}% مكتمل</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" asChild>
                                <Link href={`/dashboard/training/${course.id}`}>
                                    <PlayCircle className="ml-2 h-4 w-4" />
                                    {progress > 0 ? 'متابعة الدورة' : 'ابدأ الدورة'}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
             {!loading && courses?.length === 0 && (
                <EmptyState 
                    title="لا توجد دورات معينة"
                    description="لم يتم تعيين أي دورات لك بعد. تواصل مع مدير منظمتك لطلب الوصول إلى الدورات التدريبية."
                />
             )}
        </div>
      </div>
      
       <div>
        <h2 className="text-2xl font-bold tracking-tight">الدورات المكتملة</h2>
        <p className="text-muted-foreground">
          أحسنت! استمر في التعلم والنمو.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {loading && [...Array(1)].map((_, i) => (
                <Card key={i} className="bg-muted/50">
                    <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
            {completedCourses.map((course) => (
                <Card key={course.id} className="bg-muted/50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-md">
                                <BookMarked className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle>{course.title}</CardTitle>
                        </div>
                        <CardDescription className="pt-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                         <Button variant="secondary" className="w-full" asChild>
                           <Link href={`/dashboard/training/${course.id}`}>
                                مراجعة الدورة
                           </Link>
                         </Button>
                    </CardFooter>
                </Card>
            ))}
            {!loading && completedCourses.length === 0 && (
                <EmptyState 
                    title="لم تكمل أي دورات بعد"
                    description="عندما تنتهي من إحدى الدورات، ستظهر هنا. استمر في التقدم!"
                />
            )}
        </div>
      </div>
    </div>
  );
}
```

---

## File: src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Cairo', sans-serif;
}

@layer base {
  :root {
    --background: 240 10% 98%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 262 65% 42%;
    --primary-foreground: 300 100% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 262 80% 96%;
    --accent-foreground: 262 65% 32%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 262 65% 42%;
    --radius: 0.75rem;

    --chart-1: 262 65% 42%;
    --chart-2: 22 95% 53%;
    --chart-3: 162 72% 46%;
    --chart-4: 282 72% 56%;
    --chart-5: 342 82% 66%;

    --sidebar-background: 240 10% 3.9%;
    --sidebar-foreground: 240 5% 64.9%;
    --sidebar-primary: 262 75% 62%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 0 0% 98%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 262 75% 62%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 3.7% 15.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 262 75% 62%;
    --primary-foreground: 300 100% 98%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 262 85% 72%;

    --chart-1: 262 75% 62%;
    --chart-2: 22 95% 63%;
    --chart-3: 162 72% 56%;
    --chart-4: 282 72% 66%;
    --chart-5: 342 82% 76%;

    --sidebar-background: 240 10% 3.9%;
    --sidebar-foreground: 240 5% 64.9%;
    --sidebar-primary: 262 75% 62%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 0 0% 98%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 262 75% 62%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## File: src/app/layout.tsx

```tsx
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'EmpowerHub',
  description:
    'Integrated digital empowerment platform for training, mentorship, and eCommerce.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
```

---

## File: src/app/login/page.tsx

```tsx

"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useFirebaseApp } from '@/firebase/provider';

const formSchema = z.object({
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
    password: z.string().min(1, { message: "الرجاء إدخال كلمة المرور." }),
});

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((image) => image.id === 'login-background');
  const { toast } = useToast();
  const router = useRouter();
  const app = useFirebaseApp();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'organization':
        return '/organization-dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'mentor':
        return '/mentor-dashboard';
      case 'coach':
        return '/coach-dashboard';
      case 'beneficiary':
      default:
        return '/dashboard';
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
      setIsLoading(true);
      if (!app) {
          toast({
              variant: "destructive",
              title: "حدث خطأ",
              description: "لم يتم تهيئة Firebase بعد. الرجاء المحاولة مرة أخرى.",
          });
          setIsLoading(false);
          return;
      }
      try {
          const auth = getAuth(app);
          const firestore = getFirestore(app);

          const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          const user = userCredential.user;

          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
              const userData = userDoc.data();
              const role = userData?.role;
              toast({
                  title: "تم تسجيل الدخول بنجاح!",
                  description: `مرحباً بعودتك، ${userData?.name || 'المستخدم'}!`,
              });
              if (role) {
                const dashboardUrl = getDashboardLink(role);
                router.push(dashboardUrl);
              } else {
                 // Even if role is missing, we can default to the beneficiary dashboard
                 toast({
                    variant: "destructive",
                    title: "الدور غير محدد",
                    description: "لم يتم تحديد دور لهذا الحساب. يتم توجيهك إلى لوحة التحكم الافتراضية."
                 });
                 router.push('/dashboard');
              }
          } else {
              await auth.signOut();
              throw new Error("لم يتم العثور على ملف تعريف المستخدم.");
          }

      } catch (error: any) {
          console.error("Login error", error);
           let errorMessage = "فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
            } else if (error.message) {
                errorMessage = error.message;
            }
          toast({
              variant: "destructive",
              title: "حدث خطأ",
              description: errorMessage,
          });
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Link href="/" className="flex justify-center items-center gap-2">
              <Logo className="w-16 h-16 mx-auto" />
            </Link>
            <h1 className="text-3xl font-bold">مرحبًا بعودتك</h1>
             <p className="text-balance text-muted-foreground">
              أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك
            </p>
          </div>

           <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="text-right">
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="mail@example.com" required dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem className="text-right">
                            <div className="flex items-center">
                                <FormLabel>كلمة المرور</FormLabel>
                                <Link href="#" className="mr-auto inline-block text-sm underline">
                                هل نسيت كلمة المرور؟
                                </Link>
                            </div>
                            <FormControl>
                                <Input type="password" required dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
                <Button variant="secondary" asChild>
                    <Link href="/try-roles">تجربة المنصة بدون حساب</Link>
                </Button>
              </form>
           </Form>

          <div className="mt-4 text-center text-sm">
            ألا تمتلك حسابًا؟{' '}
            <Link href="/register" className="underline">
              أنشئ حسابًا
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            width={1200}
            height={900}
            className="h-full w-full object-cover"
            data-ai-hint={loginImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
    </div>
  );
}
```

---

## File: src/app/market/page.tsx

```tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { OrderDialog } from "@/components/order-dialog";
import { ShoppingCart, MapPin } from "lucide-react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/products-data";


export default function MarketPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "products"));
  }, [firestore]);

  const { data: allProducts, loading } = useCollection<Product>(productsQuery);

  const productsByCategory = useMemo(() => {
    if (!allProducts) return {};
    return allProducts.reduce((acc, product) => {
      const category = product.category || "متفرقات";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [allProducts]);

  return (
    <>
      <header className="py-4 px-6 border-b">
        <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <Logo className="h-8 w-8" />
                <span className="text-xl font-bold">EmpowerHub Market</span>
            </Link>
             <Button variant="outline" asChild>
                <Link href="/login">
                    تسجيل الدخول
                </Link>
            </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-6">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">المتجر العام</h1>
            <p className="text-lg text-muted-foreground mt-2">
                اكتشف منتجات فريدة ومصنوعة بحب من قبل المستفيدين في برنامجنا.
            </p>
        </div>

        <div className="space-y-12">
            {loading && (
                <section>
                    <Skeleton className="h-8 w-1/4 mb-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                             <Card key={i}><CardContent className="p-4"><Skeleton className="h-[300px]" /></CardContent></Card>
                        ))}
                    </div>
                </section>
            )}
            {!loading && Object.entries(productsByCategory).map(([category, products]) => (
                <section key={category}>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">{category}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                             <Card key={product.id} className="overflow-hidden group flex flex-col">
                                <CardHeader className="p-0">
                                    <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} width={400} height={300} className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105" />
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">{product.description}</p>
                                    <div className="text-sm text-muted-foreground mt-2">
                                        <p>من <span className="font-semibold text-primary">{product.beneficiaryName}</span></p>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{product.location}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center p-4 pt-0 mt-auto">
                                    <p className="text-lg font-semibold">{product.price.toFixed(2)} د.أ</p>
                                    <Button size="sm" onClick={() => setSelectedProduct(product)}>
                                        <ShoppingCart className="ml-2 h-4 w-4" />
                                        اطلب الآن
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            ))}
        </div>
      </main>

      <OrderDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={(open) => {
            if(!open) setSelectedProduct(null);
        }}
      />
    </>
  );
}
```

---

## File: src/app/mentor-dashboard/analytics/page.tsx

```tsx

"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, BarChart3, Clock, DollarSign, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ProgressData {
  name: string;
  progress: number;
}

interface SessionFrequencyData {
  month: string;
  sessions: number;
}

const progressConfig = {
  progress: { label: "التقدم", color: "hsl(var(--chart-1))" },
}

const sessionFrequencyConfig = {
  sessions: { label: "عدد الجلسات", color: "hsl(var(--chart-2))" },
}


export default function MentorAnalyticsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    progress: true,
    frequency: true,
  });

  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [sessionFrequencyData, setSessionFrequencyData] = useState<SessionFrequencyData[]>([]);

  const handleExport = (fullReport: boolean = false) => {
    const selectedReports = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions)
        .filter(([, isSelected]) => isSelected)
        .map(([reportName]) => reportName);

    if (selectedReports.length === 0) {
        toast({
            variant: "destructive",
            title: "لم يتم تحديد أي أجزاء",
            description: "الرجاء تحديد جزء واحد على الأقل من التقرير لتصديره.",
        });
        return;
    }

    toast({
      title: "جاري تصدير التقرير...",
      description: `سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.`,
    });
    setIsExportDialogOpen(false);
  }

  const handleCheckboxChange = (key: keyof typeof exportOptions) => {
    setExportOptions(prev => ({...prev, [key]: !prev[key]}));
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">تحليلات الإرشاد</h1>
         <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="ml-2 h-4 w-4" />
                    تصدير التقارير
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>تصدير التقارير والتحليلات</DialogTitle>
                    <DialogDescription>اختر أجزاء التقرير التي ترغب في تصديرها.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="font-medium">أجزاء التقرير</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="summary" checked={exportOptions.summary} onCheckedChange={() => handleCheckboxChange("summary")} />
                            <Label htmlFor="summary">الملخص الإحصائي</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="progress" checked={exportOptions.progress} onCheckedChange={() => handleCheckboxChange("progress")} />
                            <Label htmlFor="progress">تقدم المستفيدين</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="frequency" checked={exportOptions.frequency} onCheckedChange={() => handleCheckboxChange("frequency")} />
                            <Label htmlFor="frequency">تكرار الجلسات</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                    <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
                    <Button onClick={() => handleExport(true)}>تصدير التقرير الكامل</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستفيدين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">مستفيد نشط حاليًا</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط تقدم المستفيدين</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جلسات هذا الشهر</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">بإجمالي 0 ساعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أرباح هذا الشهر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">من الجلسات الإرشادية</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تقدم المستفيدين</CardTitle>
            <CardDescription>التقدم الحالي للمستفيدين الذين تشرف عليهم.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[250px] w-full relative">
                {progressData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <BarChart accessibilityLayer data={progressData} margin={{ left: 10, right: 20 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value}%`}/>
                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                    </BarChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تكرار الجلسات الشهرية</CardTitle>
            <CardDescription>عدد الجلسات الإرشادية التي عقدتها على مدار 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={sessionFrequencyConfig} className="h-[250px] w-full relative">
                {sessionFrequencyData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                ) : (
                    <LineChart accessibilityLayer data={sessionFrequencyData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Line dataKey="sessions" type="monotone" stroke="var(--color-sessions)" strokeWidth={2} dot={false} />
                    </LineChart>
                )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
```

---

## File: src/app/mentor-dashboard/layout.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Search,
  Settings,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useMemo } from "react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  { href: "/mentor-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/mentor-dashboard/my-beneficiaries", label: "المستفيدون", icon: Users },
  { href: "/mentor-dashboard/sessions", label: "الجلسات", icon: Calendar },
  { href: "/mentor-dashboard/analytics", label: "التحليلات", icon: BarChart3 },
  { href: "/mentor-dashboard/messages", label: "الرسائل", icon: MessageSquare },
];


export default function MentorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading } = useUser();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-mentor',
    name: 'مرشد تجريبي',
    email: 'mentor@example.com',
    role: 'mentor',
    avatarUrl: `https://picsum.photos/seed/demo-mentor/40/40`,
  }), []);

  const userProfile = authUser ? realUserProfile : demoUserProfile;


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile.name || 'مرشد';
  const displayEmail = userProfile.email || 'لا يوجد بريد إلكتروني';

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="text-lg font-semibold">EmpowerHub</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <div className="p-2 text-center text-sm bg-primary/10 mx-2 rounded-md border border-primary/20">
             <p className="font-semibold text-primary">لوحة تحكم المرشد</p>
           </div>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton asChild tooltip="الإعدادات">
             <Link href="/mentor-dashboard/settings">
                <Settings />
                <span>الإعدادات</span>
             </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="بحث..."
                  className="w-full appearance-none bg-background pr-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/mentor-dashboard/messages">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">الرسائل</span>
              </Link>
            </Button>
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar>
                  <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount dir="rtl">
              <DropdownMenuLabel className="font-normal text-right">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {authUser ? (
                <>
                  <DropdownMenuItem className="text-right">الملف الشخصي</DropdownMenuItem>
                  <DropdownMenuItem className="text-right">الإعدادات</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-right">
                    تسجيل الخروج
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">
                    تسجيل الدخول
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## File: src/app/mentor-dashboard/messages/page.tsx

```tsx
"use client";

import { ChatInterface } from "@/components/chat-interface";

export default function MentorMessagesPage() {
  return (
     <ChatInterface 
      title="مركز رسائل المرشد"
      description="التواصل مع المستفيدين الذين تشرف عليهم."
    />
  );
}
```

---

## File: src/app/mentor-dashboard/my-beneficiaries/page.tsx

```tsx

"use client";

import { MoreHorizontal, Download, User, Calendar, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";


type Session = {
    id: string;
    date: string;
    attendees: string[];
}

export default function MyBeneficiariesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [beneficiaryToView, setBeneficiaryToView] = useState<UserProfile | null>(null);

  const beneficiariesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), where("mentorId", "==", user.uid));
  }, [firestore, user]);

  const { data: beneficiaries, loading: beneficiariesLoading } = useCollection<UserProfile>(beneficiariesQuery);

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // This could be optimized further if needed by querying only sessions for this mentor's beneficiaries
    return query(collection(firestore, "sessions"), orderBy("date", "desc"));
  }, [firestore]);
  const { data: sessions, loading: sessionsLoading } = useCollection<Session>(sessionsQuery);

  const lastSessionsMap = useMemo(() => {
    if (!sessions || !beneficiaries) return new Map();
    const map = new Map<string, string>();
    beneficiaries.forEach(beneficiary => {
        const userSession = sessions.find(s => s.attendees.includes(beneficiary.id));
        if (userSession) {
            map.set(beneficiary.id, new Date(userSession.date).toLocaleDateString('ar-SA'));
        }
    });
    return map;
  }, [sessions, beneficiaries]);

  const loading = beneficiariesLoading || sessionsLoading;

  const handleExport = () => {
    toast({
      title: "جاري تصدير قائمة المستفيدين...",
      description: "سيتم تنزيل ملف CSV قريبًا.",
    });
  }

  return (
    <>
     <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>المستفيدون</CardTitle>
            <CardDescription>
              قائمة المستفيدين الذين تشرف على إرشادهم.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
              <TableHead>التقدم</TableHead>
              <TableHead className="hidden md:table-cell">آخر جلسة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && beneficiaries?.map((user) => {
              const userName = user.name || 'مستفيد بلا اسم';
              return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`} alt={userName} />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{userName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={user.progress || 0} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground">{user.progress || 0}%</span>
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{lastSessionsMap.get(user.id) || 'لم تحدد'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setBeneficiaryToView(user)}>
                        <Eye className="ml-2 h-4 w-4" />
                        عرض الملف الشخصي
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/mentor-dashboard/sessions">
                          <Calendar className="ml-2 h-4 w-4" />
                          جدولة جلسة جديدة
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/mentor-dashboard/messages">
                          <MessageSquare className="ml-2 h-4 w-4" />
                          إرسال رسالة
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
            {!loading && (!beneficiaries || beneficiaries.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">لا يوجد مستفيدون معينون لك.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

     <Dialog open={!!beneficiaryToView} onOpenChange={(isOpen) => !isOpen && setBeneficiaryToView(null)}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>الملف الشخصي للمستفيد</DialogTitle>
                <DialogDescription>تفاصيل المستفيد {beneficiaryToView?.name || 'بلا اسم'}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={beneficiaryToView?.avatarUrl || `https://picsum.photos/seed/${beneficiaryToView?.id}/100/100`} alt={beneficiaryToView?.name || ''} />
                    <AvatarFallback>{beneficiaryToView?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{beneficiaryToView?.name || 'مستفيد بلا اسم'}</h3>
                    <p className="text-muted-foreground">{beneficiaryToView?.email || 'لا يوجد بريد إلكتروني'}</p>
                </div>
                <div className="text-right space-y-2 border-t pt-4">
                    <p><strong>الفئة:</strong> {beneficiaryToView?.category || 'غير محدد'}</p>
                    <p><strong>الحالة:</strong> <Badge variant={beneficiaryToView?.status === "نشط" ? "default" : "secondary"}>{beneficiaryToView?.status || 'غير محدد'}</Badge></p>
                    <p><strong>آخر جلسة:</strong> {lastSessionsMap.get(beneficiaryToView?.id || "") || 'لم تحدد'}</p>
                    <div className="space-y-1">
                        <p><strong>التقدم العام:</strong></p>
                        <div className="flex items-center gap-2">
                           <Progress value={beneficiaryToView?.progress || 0} className="h-2" />
                           <span className="text-xs font-medium text-muted-foreground">{beneficiaryToView?.progress || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
```

---

## File: src/app/mentor-dashboard/page.tsx

```tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, Calendar, BarChart, DollarSign } from "lucide-react";
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type MentorProfile = UserProfile & {
  wallet?: {
    balance?: number;
  }
};

export default function MentorDashboardPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, loading } = useDoc<MentorProfile>(userRef);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المرشد</h1>
        <p className="text-muted-foreground">أدواتك لمتابعة المستفيدين، جدولة الجلسات، وقياس تأثيرك.</p>
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستفيدين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الجلسات القادمة</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط تقييمك</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0/5</div>
            <p className="text-xs text-muted-foreground">لا توجد تقييمات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-24" /> :
              <div className="text-3xl font-bold">{(user?.wallet?.balance || 0).toFixed(2)} د.أ</div>
            }
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 pt-4">
        <Card>
            <CardHeader>
                <CardTitle>مرحبا بك في لوحة التحكم</CardTitle>
                <CardDescription>
                هنا يمكنك متابعة مستفيديك، جدولة الجلسات، وقياس تأثيرك.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    </>
  );
}
```

---

## File: src/app/mentor-dashboard/sessions/page.tsx

```tsx

"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isPast, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Video, User, PlusCircle, MoreHorizontal, Check, X, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, addDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EvaluationDialog } from "@/components/evaluation-dialog";

type Session = {
    id: string;
    title: string;
    date: string;
    hostId: string;
    attendees: string[];
    status: 'scheduled' | 'completed' | 'cancelled';
    meetLink?: string;
    beneficiaryName?: string; // Will be populated after fetching
};

const formSchema = z.object({
  beneficiaryId: z.string({ required_error: "الرجاء اختيار مستفيد." }),
  title: z.string().min(3, { message: "يجب أن يكون عنوان الجلسة 3 أحرف على الأقل." }),
  date: z.date({ required_error: "الرجاء اختيار تاريخ." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "صيغة الوقت غير صحيحة (مثال: 14:30)." }),
  duration: z.coerce.number().positive({ message: "يجب أن تكون المدة بالدقائق رقمًا موجبًا."}),
  meetLink: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).optional().or(z.literal('')),
});

type EvaluationTarget = {
    sessionId: string;
    evaluatedId: string;
    evaluatedName: string;
};

export default function MentorSessionsPage() {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const [evaluationTarget, setEvaluationTarget] = useState<EvaluationTarget | null>(null);

    // Fetch beneficiaries for the current mentor
    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, "users"), where("mentorId", "==", authUser.uid));
    }, [firestore, authUser]);
    const { data: beneficiaries, loading: beneficiariesLoading } = useCollection<UserProfile>(beneficiariesQuery);

    const beneficiaryMap = useMemo(() => {
        if (!beneficiaries) return new Map();
        return new Map(beneficiaries.map(b => [b.id, b.name]));
    }, [beneficiaries]);
    
    // Fetch sessions for the current mentor
    const sessionsQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, "sessions"), where("hostId", "==", authUser.uid), orderBy("date", "desc"));
    }, [firestore, authUser]);
    const { data: sessions, loading: sessionsLoading } = useCollection<Session>(sessionsQuery);

    const { upcomingSessions, pastSessions } = useMemo(() => {
        const upcoming: Session[] = [];
        const past: Session[] = [];
        
        sessions?.forEach(s => {
            const sessionWithName = {
                ...s,
                beneficiaryName: beneficiaryMap.get(s.attendees[0]) || 'مستفيد غير معروف'
            };
            if (s.status === 'scheduled' && !isPast(parseISO(s.date))) {
                upcoming.push(sessionWithName);
            } else {
                past.push(sessionWithName);
            }
        });
        return { upcomingSessions: upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), pastSessions: past };
    }, [sessions, beneficiaryMap]);
    
    const loading = sessionsLoading || beneficiariesLoading;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            duration: 60,
            meetLink: "",
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore || !authUser) return;

        const [hours, minutes] = values.time.split(':').map(Number);
        const sessionDateTime = new Date(values.date);
        sessionDateTime.setHours(hours, minutes);

        const newSessionData = {
            title: values.title,
            attendees: [values.beneficiaryId],
            hostId: authUser.uid,
            date: sessionDateTime.toISOString(),
            duration: values.duration,
            status: "scheduled" as const,
            meetLink: values.meetLink || "",
        };

        const sessionsCollection = collection(firestore, "sessions");
        
        addDoc(sessionsCollection, newSessionData)
            .then(() => {
                toast({ title: "تمت الجدولة!", description: `تم جدولة جلستك "${values.title}".` });
                setIsDialogOpen(false);
                form.reset();
            })
            .catch((err) => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل جدولة الجلسة." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionsCollection.path, operation: 'create', requestResourceData: newSessionData }));
            });
    }

    async function handleUpdateSessionStatus(sessionId: string, status: 'completed' | 'cancelled') {
        if (!firestore) return;
        const sessionRef = doc(firestore, 'sessions', sessionId);

        updateDoc(sessionRef, { status })
            .then(() => {
                toast({ title: "تم التحديث", description: `تم تحديث حالة الجلسة بنجاح.` });
            })
            .catch((err) => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل تحديث حالة الجلسة." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sessionRef.path, operation: 'update', requestResourceData: { status } }));
            });
    }
    
    const handleEvaluationClick = (session: Session) => {
        setEvaluationTarget({
            sessionId: session.id,
            evaluatedId: session.attendees[0],
            evaluatedName: session.beneficiaryName || 'المستفيد',
        });
    };

  return (
    <>
    <div className="space-y-8">
         <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>الجلسات</CardTitle>
                        <CardDescription>إدارة وجدولة جلسات الإرشاد مع المستفيدين.</CardDescription>
                    </div>
                     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="ml-2 h-4 w-4" />
                                جدولة جلسة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl" onPointerDownOutside={(e) => { if (e.target instanceof Element && e.target.closest('.rdp')) { e.preventDefault(); } }}>
                             <DialogHeader>
                                <DialogTitle>جدولة جلسة جديدة</DialogTitle>
                                <DialogDescription>
                                    املأ التفاصيل أدناه لجدولة جلسة إرشادية جديدة.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                     <FormField
                                        control={form.control}
                                        name="beneficiaryId"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>المستفيد</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر مستفيدًا" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {beneficiariesLoading ? <SelectItem value="loading" disabled>جاري التحميل...</SelectItem> : 
                                                 beneficiaries?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>عنوان الجلسة</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="مثال: مراجعة خطة التسويق" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="date" render={({ field }) => (
                                            <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                                            <Popover><PopoverTrigger asChild>
                                                <FormControl>
                                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر تاريخًا</span>}
                                                    <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                                </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().toISOString().split('T')[0])} initialFocus />
                                            </PopoverContent>
                                            </Popover>
                                            <FormMessage /></FormItem>
                                        )}/>
                                         <FormField control={form.control} name="time" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>وقت الجلسة</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                     </div>
                                      <FormField control={form.control} name="duration" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>المدة (بالدقائق)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="60" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                     <FormField
                                         control={form.control}
                                         name="meetLink"
                                         render={({ field }) => (
                                             <FormItem>
                                                 <FormLabel>رابط Google Meet (اختياري)</FormLabel>
                                                 <div className="flex items-center gap-2">
                                                     <FormControl>
                                                         <Input dir="ltr" placeholder="https://meet.google.com/..." {...field} />
                                                     </FormControl>
                                                     <Button type="button" variant="outline" onClick={() => field.onChange(`https://meet.google.com/lookup/${Math.random().toString(36).substring(2, 10)}`)}>
                                                         إنشاء رابط
                                                     </Button>
                                                 </div>
                                                 <FormDescription>يمكنك لصق رابط جلسة حالي أو إنشاء رابط جديد.</FormDescription>
                                                 <FormMessage />
                                             </FormItem>
                                         )}
                                     />
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                                        <Button type="submit">جدولة</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                     </Dialog>
                </div>
            </CardHeader>
         </Card>
         <Card>
            <CardHeader>
                <CardTitle>الجلسات القادمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading && [...Array(1)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                {!loading && upcomingSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                            <p className="font-semibold">{session.title}</p>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {session.beneficiaryName}</span>
                                <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(parseISO(session.date), "p", { locale: ar })}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button asChild disabled={!session.meetLink}>
                               <a href={session.meetLink} target="_blank" rel="noopener noreferrer">
                                    <Video className="ml-2 h-4 w-4" />
                                    انضم للجلسة
                               </a>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" dir="rtl">
                                    <DropdownMenuItem onClick={() => handleUpdateSessionStatus(session.id, 'completed')}><Check className="ml-2 h-4 w-4" /> وضع علامة كمكتملة</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateSessionStatus(session.id, 'cancelled')}><X className="ml-2 h-4 w-4" /> إلغاء الجلسة</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
                 {!loading && upcomingSessions.length === 0 && <p className="text-center text-muted-foreground p-4">لا توجد جلسات قادمة مجدولة.</p>}
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
                <CardTitle>الجلسات السابقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                 {!loading && pastSessions.map(session => (
                    <div key={session.id} className="p-3 border-b flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{session.title} <span className="text-sm text-muted-foreground font-normal">مع {session.beneficiaryName} - {format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span></p>
                            <p className="text-sm text-muted-foreground mt-1"><b>الحالة:</b> {session.status === 'completed' ? 'مكتملة' : 'ملغاة'}</p>
                        </div>
                         {session.status === 'completed' && (
                            <Button variant="outline" size="sm" onClick={() => handleEvaluationClick(session)}>
                                <Star className="ml-2 h-4 w-4" />
                                تقييم المستفيد
                            </Button>
                        )}
                    </div>
                ))}
                {!loading && pastSessions.length === 0 && <p className="text-center text-muted-foreground p-4">لا توجد جلسات سابقة.</p>}
            </CardContent>
         </Card>
    </div>
    {evaluationTarget && authUser && (
        <EvaluationDialog
            isOpen={!!evaluationTarget}
            onOpenChange={(isOpen) => !isOpen && setEvaluationTarget(null)}
            sessionId={evaluationTarget.sessionId}
            evaluatorId={authUser.uid}
            evaluatedId={evaluationTarget.evaluatedId}
            evaluatedName={evaluationTarget.evaluatedName}
            type="mentor_to_beneficiary"
        />
    )}
    </>
  );
}
```

---

## File: src/app/mentor-dashboard/settings/page.tsx

```tsx
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Save, Wallet } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const payoutSchema = z.object({
  accountHolderName: z.string().min(2, { message: 'يجب أن يكون اسم صاحب الحساب حرفين على الأقل.' }),
  iban: z.string().min(15, { message: 'الرجاء إدخال رقم IBAN صحيح.' }).max(34, { message: 'الرجاء إدخال رقم IBAN صحيح.' }),
  bankName: z.string().min(3, { message: 'يجب أن يكون اسم البنك 3 أحرف على الأقل.' }),
  address: z.string().min(5, { message: 'يجب أن يكون العنوان 5 أحرف على الأقل.' }),
});

type PayoutInfo = z.infer<typeof payoutSchema>;

type MentorProfile = UserProfile & {
  wallet?: {
    balance?: number;
    payoutInfo?: PayoutInfo;
  }
};

export default function MentorSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, loading } = useDoc<MentorProfile>(userRef);

  const form = useForm<PayoutInfo>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      accountHolderName: '',
      iban: '',
      bankName: '',
      address: '',
    },
  });

  useEffect(() => {
    if (user?.wallet?.payoutInfo) {
      form.reset(user.wallet.payoutInfo);
    }
  }, [user, form]);
  

  async function onSubmit(values: PayoutInfo) {
    if (!userRef) return;
    
    updateDoc(userRef, { 'wallet.payoutInfo': values })
        .then(() => {
            toast({
                title: 'تم حفظ الإعدادات',
                description: 'تم تحديث معلومات الدفع الخاصة بك بنجاح.',
            });
        })
        .catch(err => {
            toast({ variant: 'destructive', title: 'خطأ!', description: 'فشلت عملية الحفظ.' });
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { 'wallet.payoutInfo': values } }));
        });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
          <h1 className="text-lg font-semibold md:text-2xl">المحفظة والإعدادات</h1>
          <p className="text-muted-foreground">إدارة أرباحك وتفاصيل الدفع الخاصة بك.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  رصيد الأرباح
              </CardTitle>
              <CardDescription>
                  هذا هو إجمالي أرباحك الحالية من جلسات الإرشاد.
              </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-32" /> :
              <p className="text-3xl font-bold">
                  {(user?.wallet?.balance || 0).toFixed(2)} د.أ
              </p>
            }
              <p className="text-xs text-muted-foreground mt-1">
                  سيتم تحويل الرصيد إلى حسابك البنكي في بداية كل شهر.
              </p>
          </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        معلومات الدفع
                    </CardTitle>
                    <CardDescription>
                        الرجاء إدخال معلومات حسابك البنكي لاستلام أرباحك.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                        <FormItem><FormLabel>اسم صاحب الحساب</FormLabel><FormControl><Input placeholder="الاسم كما هو مسجل في البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="iban" render={({ field }) => (
                        <FormItem><FormLabel>رقم الحساب المصرفي الدولي (IBAN)</FormLabel><FormControl><Input dir="ltr" placeholder="JOXX XXXX XXXX XXXX XXXX XXXX XX" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="bankName" render={({ field }) => (
                        <FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input placeholder="اسم البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>عنوان الفرع</FormLabel><FormControl><Input placeholder="عنوان فرع البنك" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <div>
                <Button type="submit">
                    <Save className="ml-2 h-4 w-4" />
                    حفظ المعلومات
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
```

---

## File: src/app/organization-dashboard/beneficiaries/page.tsx

```tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Upload, Download, File, User, KeyRound, Trash2, Eye, GraduationCap } from "lucide-react";
import { useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useUser, type UserProfile } from "@/firebase";
import { collection, query, where, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const ORG_ID = "org-hope"; // Mock Organization ID

// Represents the data structure in Firestore's 'users' collection
type RawBeneficiary = UserProfile & {
  progress?: number;
  mentorId?: string;
  coachId?: string;
  category?: string;
};

// Represents the enriched data structure used by the component
type Beneficiary = RawBeneficiary & {
  status: "نشط" | "مكتمل" | "جديد";
  mentorName?: string;
  coachName?: string;
};


const formSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  category: z.string().min(2, { message: "يجب أن تكون الفئة حرفين على الأقل." }),
});

const assignFormSchema = z.object({
    assigneeId: z.string({ required_error: "الرجاء اختيار شخص." }),
});

export default function BeneficiariesPage() {
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("الكل");
    const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<Beneficiary | null>(null);
    const [beneficiaryToView, setBeneficiaryToView] = useState<Beneficiary | null>(null);
    const [assignment, setAssignment] = useState<{beneficiary: Beneficiary, role: 'mentor' | 'coach'} | null>(null);
    const firestore = useFirestore();

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), where("role", "==", "beneficiary"), where("organizationId", "==", ORG_ID));
    }, [firestore]);
    const { data: rawBeneficiaries, loading: beneficiariesLoading } = useCollection<RawBeneficiary>(beneficiariesQuery);

    const mentorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), where("role", "==", "mentor"), where("organizationId", "==", ORG_ID));
    }, [firestore]);
    const { data: mentors, loading: mentorsLoading } = useCollection<UserProfile>(mentorsQuery);

    const coachesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), where("role", "==", "coach"), where("organizationId", "==", ORG_ID));
    }, [firestore]);
    const { data: coaches, loading: coachesLoading } = useCollection<UserProfile>(coachesQuery);

    const loading = beneficiariesLoading || mentorsLoading || coachesLoading;

    const usersMap = useMemo(() => {
        const map = new Map<string, string>();
        if (mentors) mentors.forEach(m => map.set(m.id, m.name || ''));
        if (coaches) coaches.forEach(c => map.set(c.id, c.name || ''));
        return map;
    }, [mentors, coaches]);

    const beneficiaries: Beneficiary[] | null = useMemo(() => {
        if (!rawBeneficiaries) return null;
        return rawBeneficiaries.map(user => {
            const progress = user.progress || 0;
            let status: "نشط" | "مكتمل" | "جديد";
            if (progress === 100) {
                status = "مكتمل";
            } else if (progress > 0) {
                status = "نشط";
            } else {
                status = "جديد";
            }
            return {
                ...user,
                progress: progress,
                status: status,
                mentorName: user.mentorId ? usersMap.get(user.mentorId) : undefined,
                coachName: user.coachId ? usersMap.get(user.coachId) : undefined,
            };
        }).sort((a, b) => ((a.name || '') > (b.name || '')) ? 1 : -1);
    }, [rawBeneficiaries, usersMap]);

    const categories = useMemo(() => {
        if (!beneficiaries) return ["الكل"];
        const allCategories = beneficiaries.map(b => b.category).filter(Boolean);
        return ["الكل", ...Array.from(new Set(allCategories as string[]))];
    }, [beneficiaries]);

    const filteredBeneficiaries = useMemo(() => {
        if (!beneficiaries) return null;
        if (selectedCategory === "الكل") {
            return beneficiaries;
        }
        return beneficiaries.filter(b => b.category === selectedCategory);
    }, [beneficiaries, selectedCategory]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "", category: "" },
    });

    const assignForm = useForm<z.infer<typeof assignFormSchema>>({
        resolver: zodResolver(assignFormSchema),
    });

    function onAddSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore) return;

        const newBeneficiaryData = {
            name: values.name,
            email: values.email,
            role: "beneficiary" as const,
            organizationId: ORG_ID,
            category: values.category,
            progress: 0,
        };
        
        const beneficiariesCollection = collection(firestore, "users");
        
        addDoc(beneficiariesCollection, newBeneficiaryData)
          .then(() => {
            toast({
                title: "تم بنجاح!",
                description: `تمت إضافة المستفيد "${values.name}" إلى منظمتك.`,
            });
            form.reset();
            setIsAddDialogOpen(false);
          })
          .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: beneficiariesCollection.path,
                operation: 'create',
                requestResourceData: newBeneficiaryData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: "destructive",
                title: "فشل الإنشاء",
                description: "ليس لديك إذن لإضافة مستفيدين جدد.",
            });
          });
    }
    
    async function handleAssignSubmit(values: z.infer<typeof assignFormSchema>) {
        if (!firestore || !assignment) return;
        const beneficiaryRef = doc(firestore, 'users', assignment.beneficiary.id);
        const fieldToUpdate = assignment.role === 'mentor' ? 'mentorId' : 'coachId';
        
        updateDoc(beneficiaryRef, { [fieldToUpdate]: values.assigneeId })
            .then(() => {
                toast({ title: "تم التعيين بنجاح!", description: `تم تعيين ${assignment.role === 'mentor' ? 'المرشد' : 'المدرب'} بنجاح.` });
                setAssignment(null);
            })
            .catch((err) => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل التعيين." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: beneficiaryRef.path, operation: 'update', requestResourceData: { [fieldToUpdate]: values.assigneeId } }));
            });
    }

    const handleExport = () => {
        toast({
            title: "جاري تصدير قائمة المستفيدين...",
            description: "سيتم تنزيل ملف CSV قريبًا.",
        });
    }

    const handleImport = () => {
        toast({
            title: "تم رفع الملف بنجاح!",
            description: "جاري معالجة بيانات المستفيدين واستيرادهم.",
        });
        setIsImportDialogOpen(false);
    }

    const handleDelete = () => {
        if (!firestore || !beneficiaryToDelete) return;
        const beneficiaryRef = doc(firestore, 'users', beneficiaryToDelete.id);
        
        deleteDoc(beneficiaryRef)
        .then(() => {
            toast({
                variant: "destructive",
                title: "تمت الإزالة!",
                description: `تمت إزالة "${beneficiaryToDelete.name}" من المنظمة.`
            });
            setBeneficiaryToDelete(null);
        })
        .catch((err) => {
            toast({
                variant: "destructive",
                title: "فشلت الإزالة",
                description: "ليس لديك إذن لإزالة هذا المستفيد.",
            });
            const permissionError = new FirestorePermissionError({ path: beneficiaryRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            setBeneficiaryToDelete(null);
        })
    }

    const peopleToAssign = assignment?.role === 'mentor' ? mentors : coaches;
    const assignmentTitle = `تعيين ${assignment?.role === 'mentor' ? 'مرشد' : 'مدرب'} لـ ${assignment?.beneficiary.name}`;
    const assignmentDescription = `اختر ${assignment?.role === 'mentor' ? 'المرشد' : 'المدرب'} المناسب من القائمة.`;

  return (
    <>
     <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>المستفيدون</CardTitle>
                <CardDescription>
                عرض وإدارة المستفيدين المسجلين في منظمتك حسب الفئة.
                </CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Upload className="ml-2 h-4 w-4" />
                            استيراد
                        </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>استيراد مستفيدين من ملف</DialogTitle>
                            <DialogDescription>
                                ارفع ملف CSV أو Excel يحتوي على بيانات المستفيدين. يجب أن يحتوي الملف على أعمدة "الاسم" و "البريد الإلكتروني" و "الفئة".
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="import-file" className="sr-only">اختر ملفًا</Label>
                            <Input id="import-file" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                        </div>
                        <DialogFooter>
                             <DialogClose asChild>
                                <Button variant="ghost">إلغاء</Button>
                            </DialogClose>
                            <Button onClick={handleImport}>
                                <File className="ml-2 h-4 w-4" />
                                تأكيد الاستيراد
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            إضافة مستفيد
                        </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة مستفيد جديد</DialogTitle>
                            <DialogDescription>
                                أدخل معلومات المستفيد الجديد ودعوته للانضمام.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="مثال: سارة عبدالله" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input dir="ltr" placeholder="sara@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem><FormLabel>الفئة</FormLabel><FormControl><Input placeholder="مثال: طبخ، حرف يدوية" {...field} /></FormControl><FormDescription>أدخل فئة لتصنيف المستفيد (مثل: طبخ، تجميل، حرف يدوية).</FormDescription><FormMessage /></FormItem>
                                )}/>
                                 <DialogFooter>
                                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                                    <Button type="submit">إرسال دعوة</Button>
                                 </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                 </Dialog>
            </div>
        </div>
      </CardHeader>
      <Tabs dir="rtl" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <div className="px-6 border-b">
            <TabsList>
                {categories.map(category => (
                    <TabsTrigger key={category} value={category}>{category || 'غير مصنف'}</TabsTrigger>
                ))}
            </TabsList>
        </div>
        <CardContent className="pt-6">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                <TableHead className="hidden sm:table-cell">الفئة</TableHead>
                <TableHead>التقدم</TableHead>
                <TableHead>المرشد/المدرب</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead>
                    <span className="sr-only">الإجراءات</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                <>
                    {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[120px]" /></div></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[180px]" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                    ))}
                </>
                )}
                {!loading && filteredBeneficiaries && filteredBeneficiaries.map((user) => {
                  const userName = user.name || 'مستفيد بلا اسم';
                  return (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`} alt={userName} />
                            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{userName}</span>
                        </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{user.category || 'غير مصنف'}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Progress value={user.progress} className="h-2 w-24" />
                                <span className="text-xs text-muted-foreground">{user.progress}%</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {user.mentorName && <div className="flex items-center gap-1 text-xs"><User className="h-3 w-3" /> {user.mentorName}</div>}
                            {user.coachName && <div className="flex items-center gap-1 text-xs mt-1"><GraduationCap className="h-3 w-3" /> {user.coachName}</div>}
                            {!user.mentorName && !user.coachName && <span className="text-xs text-muted-foreground">غير معين</span>}
                        </TableCell>
                        <TableCell className="text-center">
                        <Badge variant={user.status === "نشط" ? "default" : user.status === "مكتمل" ? "outline" : "secondary"}>
                            {user.status}
                        </Badge>
                        </TableCell>
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">قائمة</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" dir="rtl">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setBeneficiaryToView(user)}>
                                <Eye className="ml-2 h-4 w-4" />
                                عرض الملف الشخصي
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setAssignment({beneficiary: user, role: 'mentor'})}>
                                <User className="ml-2 h-4 w-4" />
                                تعيين مرشد
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setAssignment({beneficiary: user, role: 'coach'})}>
                                <GraduationCap className="ml-2 h-4 w-4" />
                                تعيين مدرب
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({title: "تم إرسال رابط إعادة تعيين كلمة المرور."})}>
                                <KeyRound className="ml-2 h-4 w-4" />
                                إعادة تعيين كلمة المرور
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setBeneficiaryToDelete(user)}}>
                            <Trash2 className="ml-2 h-4 w-4" />
                            إزالة من المنظمة
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )})}
                {!loading && (!filteredBeneficiaries || filteredBeneficiaries.length === 0) && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">لا يوجد مستفيدون لعرضهم في هذه الفئة.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
       </Tabs>
    </Card>

    <Dialog open={!!assignment} onOpenChange={(isOpen) => !isOpen && setAssignment(null)}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>{assignmentTitle}</DialogTitle>
                <DialogDescription>{assignmentDescription}</DialogDescription>
            </DialogHeader>
            <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(handleAssignSubmit)} className="space-y-4 pt-4">
                    <FormField
                        control={assignForm.control}
                        name="assigneeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>اختر {assignment?.role === 'mentor' ? 'المرشد' : 'المدرب'}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`اختر ${assignment?.role === 'mentor' ? 'مرشداً' : 'مدرباً'}`} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {peopleToAssign?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - {p.expertise || 'خبرة عامة'}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                        <Button type="submit">حفظ التعيين</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!beneficiaryToDelete} onOpenChange={(isOpen) => !isOpen && setBeneficiaryToDelete(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء سيقوم بإزالة المستفيد "{beneficiaryToDelete?.name}" من منظمتك.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>نعم، قم بالإزالة</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={!!beneficiaryToView} onOpenChange={(isOpen) => !isOpen && setBeneficiaryToView(null)}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>الملف الشخصي للمستفيد</DialogTitle>
                <DialogDescription>تفاصيل المستفيد {beneficiaryToView?.name || 'بلا اسم'}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={beneficiaryToView?.avatarUrl || `https://picsum.photos/seed/${beneficiaryToView?.id}/100/100`} alt={beneficiaryToView?.name || ''} />
                    <AvatarFallback>{beneficiaryToView?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{beneficiaryToView?.name || 'مستفيد بلا اسم'}</h3>
                    <p className="text-muted-foreground">{beneficiaryToView?.email || 'لا يوجد بريد إلكتروني'}</p>
                </div>
                <div className="text-right space-y-2 border-t pt-4">
                    <p><strong>الفئة:</strong> {beneficiaryToView?.category || 'غير محدد'}</p>
                    <p><strong>الحالة:</strong> <Badge variant={beneficiaryToView?.status === "نشط" ? "default" : beneficiaryToView?.status === "مكتمل" ? "outline" : "secondary"}>{beneficiaryToView?.status || 'غير محدد'}</Badge></p>
                    <div className="space-y-1">
                        <p><strong>التقدم العام:</strong></p>
                        <div className="flex items-center gap-2">
                           <Progress value={beneficiaryToView?.progress || 0} className="h-2" />
                           <span className="text-xs font-medium text-muted-foreground">{beneficiaryToView?.progress || 0}%</span>
                        </div>
                    </div>
                     <p className="pt-2"><strong>المرشد المعين:</strong> {beneficiaryToView?.mentorName || 'غير معين'}</p>
                    <p><strong>المدرب المعين:</strong> {beneficiaryToView?.coachName || 'غير معين'}</p>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
```

---

## File: src/app/organization-dashboard/coaches/page.tsx

```tsx
"use client";

import { UserPlus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, addDoc, updateDoc, doc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


const addCoachSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  expertise: z.string().min(2, { message: "يجب أن يكون التخصص حرفين على الأقل." }),
});

const assignToBeneficiarySchema = z.object({
  beneficiaryId: z.string({ required_error: "الرجاء اختيار مستفيد." }),
});

export default function OrgCoachesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { userProfile } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [coachToAssign, setCoachToAssign] = useState<UserProfile | null>(null);
    
    // Get coaches assigned to THIS organization
    const orgCoachesQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.organizationId) return null;
        return query(collection(firestore, "users"), where("role", "==", "coach"), where("organizationId", "==", userProfile.organizationId));
    }, [firestore, userProfile?.organizationId]);
    const { data: orgCoaches, loading: orgCoachesLoading } = useCollection<UserProfile>(orgCoachesQuery);

    // Get ALL coaches on the platform to find unassigned ones
    const allCoachesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), where("role", "==", "coach"));
    }, [firestore]);
    const { data: allCoaches, loading: allCoachesLoading } = useCollection<UserProfile>(allCoachesQuery);

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.organizationId) return null;
        return query(collection(firestore, "users"), where("role", "==", "beneficiary"), where("organizationId", "==", userProfile.organizationId));
    }, [firestore, userProfile?.organizationId]);
    const { data: beneficiaries, loading: beneficiariesLoading } = useCollection<UserProfile>(beneficiariesQuery);

    const unassignedCoaches = useMemo(() => {
        if (!allCoaches) return [];
        return allCoaches.filter(c => !c.organizationId);
    }, [allCoaches]);

    const loading = orgCoachesLoading || allCoachesLoading || beneficiariesLoading;
    
    const form = useForm<z.infer<typeof addCoachSchema>>({
        resolver: zodResolver(addCoachSchema),
        defaultValues: { name: "", email: "", expertise: "" },
    });

    const assignForm = useForm<z.infer<typeof assignToBeneficiarySchema>>({
        resolver: zodResolver(assignToBeneficiarySchema),
    });

    async function handleAddCoach(values: z.infer<typeof addCoachSchema>) {
        if (!firestore || !userProfile?.organizationId) return;
        const newCoachData = {
            ...values,
            role: 'coach',
            organizationId: userProfile.organizationId,
            status: 'نشط',
            createdAt: new Date().toISOString(),
        };

        addDoc(collection(firestore, "users"), newCoachData)
            .then(() => {
                toast({ title: "تمت الإضافة بنجاح!", description: `تمت إضافة المدرب ${values.name} إلى منظمتك.` });
                setIsDialogOpen(false);
                form.reset();
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشلت إضافة المدرب." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'create', requestResourceData: newCoachData }));
            });
    }

    async function handleAssignCoach(coach: UserProfile) {
        if (!firestore || !userProfile?.organizationId) return;
        const coachRef = doc(firestore, 'users', coach.id);

        updateDoc(coachRef, { organizationId: userProfile.organizationId })
            .then(() => {
                toast({ title: "تم التعيين بنجاح!", description: `تم تعيين المدرب ${coach.name} إلى منظمتك.` });
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل تعيين المدرب." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: coachRef.path, operation: 'update', requestResourceData: { organizationId: userProfile.organizationId } }));
            });
    }

    async function handleAssignToBeneficiary(values: z.infer<typeof assignToBeneficiarySchema>) {
        if (!firestore || !coachToAssign) return;
        const beneficiaryRef = doc(firestore, 'users', values.beneficiaryId);

        updateDoc(beneficiaryRef, { coachId: coachToAssign.id })
            .then(() => {
                toast({ title: "تم التعيين بنجاح!", description: `تم تعيين المدرب ${coachToAssign.name} للمستفيد.` });
                setCoachToAssign(null);
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل تعيين المدرب للمستفيد." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: beneficiaryRef.path, operation: 'update', requestResourceData: { coachId: coachToAssign.id } }));
            });
    }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle>المدربون</CardTitle>
                  <CardDescription>
                  إدارة وتعيين المدربين لمنظمتك.
                  </CardDescription>
              </div>
               <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                      <Button>
                          <UserPlus className="ml-2 h-4 w-4" />
                          إضافة أو تعيين مدرب
                      </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl" className="sm:max-w-lg">
                      <DialogHeader>
                          <DialogTitle>إدارة المدربين</DialogTitle>
                          <DialogDescription>
                              إضافة مدرب جديد يدويًا أو تعيين مدرب مسجل بالفعل في المنصة.
                          </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="assign" className="pt-4">
                          <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="assign">تعيين مدرب مسجل</TabsTrigger>
                              <TabsTrigger value="add">إضافة مدرب جديد</TabsTrigger>
                          </TabsList>
                          <TabsContent value="assign">
                              <p className="text-sm text-muted-foreground my-4">اختر مدربًا من القائمة لتعيينه إلى منظمتك.</p>
                              <ScrollArea className="h-60">
                                  <div className="space-y-2 pr-4">
                                      {unassignedCoaches.length > 0 ? unassignedCoaches.map(coach => (
                                          <div key={coach.id} className="flex items-center justify-between p-2 rounded-md border">
                                              <div className="flex items-center gap-2">
                                                  <Avatar className="h-8 w-8">
                                                      <AvatarImage src={coach.avatarUrl || `https://picsum.photos/seed/${coach.id}/40/40`} />
                                                      <AvatarFallback>{coach.name?.charAt(0) || 'C'}</AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                      <p className="font-medium">{coach.name || 'مدرب بلا اسم'}</p>
                                                      <p className="text-xs text-muted-foreground">{coach.expertise || 'خبرة عامة'}</p>
                                                  </div>
                                              </div>
                                              <Button size="sm" onClick={() => handleAssignCoach(coach)}>تعيين</Button>
                                          </div>
                                      )) : <p className="text-center text-muted-foreground py-8">لا يوجد مدربون غير معينين حاليًا.</p>}
                                  </div>
                              </ScrollArea>
                          </TabsContent>
                          <TabsContent value="add">
                              <Form {...form}>
                                  <form onSubmit={form.handleSubmit(handleAddCoach)} className="space-y-4 pt-4">
                                      <FormField control={form.control} name="name" render={({ field }) => (
                                          <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="اسم المدرب" {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                       <FormField control={form.control} name="email" render={({ field }) => (
                                          <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input dir="ltr" placeholder="coach@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                       <FormField control={form.control} name="expertise" render={({ field }) => (
                                          <FormItem><FormLabel>مجال الخبرة</FormLabel><FormControl><Input placeholder="ريادة الأعمال، التسويق الرقمي..." {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                      <DialogFooter>
                                          <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                                          <Button type="submit">إضافة المدرب</Button>
                                      </DialogFooter>
                                  </form>
                              </Form>
                          </TabsContent>
                      </Tabs>
                  </DialogContent>
               </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>مجال الخبرة</TableHead>
                <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-32" /></TableCell>
                  </TableRow>
              ))}
              {!loading && orgCoaches?.map((coach) => {
                const coachName = coach.name || 'مدرب بلا اسم';
                return (
                <TableRow key={coach.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={coach.avatarUrl || `https://picsum.photos/seed/${coach.id}/40/40`} alt={coachName} />
                        <AvatarFallback>{coachName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{coachName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{coach.expertise || 'خبرة عامة'}</TableCell>
                  <TableCell className="hidden md:table-cell">{coach.email || '-'}</TableCell>
                  <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setCoachToAssign(coach)}>
                          <GraduationCap className="ml-2 h-4 w-4" />
                          تعيين لمستفيد
                      </Button>
                  </TableCell>
                </TableRow>
              )})}
              {!loading && (!orgCoaches || orgCoaches.length === 0) && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">لا يوجد مدربون تابعون لهذه المنظمة.</TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!coachToAssign} onOpenChange={(isOpen) => { if (!isOpen) setCoachToAssign(null) }}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>تعيين المدرب: {coachToAssign?.name}</DialogTitle>
                <DialogDescription>اختر مستفيدًا لتعيين هذا المدرب له.</DialogDescription>
            </DialogHeader>
            <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(handleAssignToBeneficiary)} className="space-y-4 pt-4">
                     <FormField
                        control={assignForm.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>المستفيد</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر مستفيدًا..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {beneficiaries && beneficiaries.length > 0 ? 
                                            beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>) :
                                            <SelectItem value="loading" disabled>لا يوجد مستفيدون في منظمتك</SelectItem>
                                        }
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                        <Button type="submit">حفظ التعيين</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## File: src/app/organization-dashboard/courses/page.tsx

```tsx
"use client";

import { BookUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Course = {
    id: string;
    title: string;
    category?: string;
};

type Beneficiary = {
    id: string;
    name: string;
};

export default function OrgCoursesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { userProfile } = useUser();
    const ORG_ID = userProfile?.organizationId;

    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "courses"));
    }, [firestore]);
    const { data: courses, loading: coursesLoading } = useCollection<Course>(coursesQuery);

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !ORG_ID) return null;
        return query(collection(firestore, "users"), where("role", "==", "beneficiary"), where("organizationId", "==", ORG_ID));
    }, [firestore, ORG_ID]);
    const { data: beneficiaries, loading: beneficiariesLoading } = useCollection<Beneficiary>(beneficiariesQuery);

    const loading = coursesLoading || beneficiariesLoading;


    const handleAssign = (courseTitle: string) => {
         toast({
            title: "تم التعيين بنجاح!",
            description: `تم تعيين دورة "${courseTitle}" للمستفيدين المختارين.`,
        });
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الدورات التدريبية</CardTitle>
        <CardDescription>
          تعيين الدورات التدريبية للمستفيدين في منظمتك.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان الدورة</TableHead>
              <TableHead className="hidden md:table-cell">الفئة</TableHead>
              <TableHead className="text-center">عدد المعينين</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading && [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-[50px] mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-[150px] float-right" /></TableCell>
                </TableRow>
            ))}
            {!loading && courses?.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                 <TableCell className="hidden md:table-cell">{course.category || 'غير مصنف'}</TableCell>
                <TableCell className="text-center">0</TableCell>
                <TableCell className="text-right">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <BookUp className="ml-2 h-4 w-4" />
                                تعيين لمستفيدين
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                             <DialogHeader>
                                <DialogTitle>تعيين دورة: {course.title}</DialogTitle>
                                <DialogDescription>
                                    اختر المستفيدين لتعيين هذه الدورة لهم.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-64 overflow-y-auto">
                                <p className="text-sm font-medium">قائمة المستفيدين</p>
                                <div className="space-y-2">
                                {beneficiaries && beneficiaries.length > 0 ? beneficiaries.map(b => (
                                    <div key={b.id} className="flex items-center space-x-2 space-x-reverse">
                                        <Checkbox id={`cb-${b.id}`} />
                                        <Label htmlFor={`cb-${b.id}`} className="font-normal">{b.name}</Label>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">لا يوجد مستفيدون في منظمتك.</p>
                                )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => handleAssign(course.title)} disabled={!beneficiaries || beneficiaries.length === 0}>تأكيد التعيين</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TableCell>
              </TableRow>
            ))}
             {!loading && (!courses || courses.length === 0) && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">لا توجد دورات متاحة.</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

## File: src/app/organization-dashboard/layout.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Search,
  Settings,
  Users,
  BarChart3,
  BookOpen,
  Store,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { useMemo } from "react";
import Image from "next/image";
import { getAuth, signOut } from "firebase/auth";
import { doc } from 'firebase/firestore';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useDoc } from "@/firebase/firestore/use-doc";
import { NotificationBell } from "@/components/notification-bell";

const menuItems = [
  { href: "/organization-dashboard", label: "لوحة التحكم", icon: LayoutGrid },
  { href: "/organization-dashboard/beneficiaries", label: "المستفيدون", icon: Users },
  { href: "/organization-dashboard/team", label: "فريق العمل", icon: Users },
  { href: "/organization-dashboard/mentors", label: "المرشدون", icon: Users },
  { href: "/organization-dashboard/coaches", label: "المدربون", icon: GraduationCap },
  { href: "/organization-dashboard/courses", label: "الدورات", icon: BookOpen },
  { href: "/organization-dashboard/stores", label: "المتاجر", icon: Store },
  { href: "/organization-dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/organization-dashboard/messages", label: "الرسائل", icon: MessageSquare },
];


export default function OrganizationDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, userProfile: realUserProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const demoUserProfile = useMemo<UserProfile>(() => ({
    id: 'demo-org',
    name: 'مدير منظمة تجريبي',
    email: 'org@example.com',
    role: 'organization',
    organizationId: 'org-hope', // Mock ID
    avatarUrl: `https://picsum.photos/seed/demo-org/40/40`,
  }), []);

  const userProfile = authUser ? realUserProfile : demoUserProfile;

  const orgRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organizationId) return null;
    return doc(firestore, 'organizations', userProfile.organizationId);
  }, [firestore, userProfile?.organizationId]);

  const { data: organization, loading: orgLoading } = useDoc<any>(orgRef);
  const loading = userLoading || (authUser && orgLoading);

  const orgName = authUser ? (organization?.name || "منظمتي") : "منظمة تجريبية";
  const logoUrl = authUser ? organization?.logoUrl : null;
  
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile.name || 'مدير';
  const displayEmail = userProfile.email || 'لا يوجد بريد إلكتروني';

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex flex-col items-center text-center gap-2 p-2">
            {logoUrl ? <Image src={logoUrl} alt="شعار المنظمة" width={80} height={80} className="h-20 w-20 object-contain" /> : <Logo className="h-16 w-16" />}
            <span className="text-lg font-semibold">{orgName}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <div className="p-2 text-center text-sm bg-primary/10 mx-2 rounded-md border border-primary/20">
             <p className="font-semibold text-primary">لوحة تحكم المنظمة</p>
           </div>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/organization-dashboard' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton asChild tooltip="الإعدادات">
             <Link href="/organization-dashboard/settings">
                <Settings />
                <span>الإعدادات</span>
             </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="بحث..."
                  className="w-full appearance-none bg-background pr-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/organization-dashboard/messages">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">الرسائل</span>
              </Link>
            </Button>
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar>
                  <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
                  <AvatarFallback>{(displayName || 'O').charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount dir="rtl">
              <DropdownMenuLabel className="font-normal text-right">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               {authUser ? (
                <>
                    <DropdownMenuItem className="text-right">الملف الشخصي</DropdownMenuItem>
                    <DropdownMenuItem className="text-right">الفواتير</DropdownMenuItem>
                    <DropdownMenuItem className="text-right">الإعدادات</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout} className="text-right">
                        تسجيل الخروج
                    </DropdownMenuItem>
                </>
              ) : (
                 <DropdownMenuItem onSelect={() => router.push('/login')} className="text-right">
                    تسجيل الدخول
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## File: src/app/organization-dashboard/mentors/page.tsx

```tsx
"use client";

import { UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, addDoc, updateDoc, doc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


const addMentorSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  expertise: z.string().min(2, { message: "يجب أن يكون التخصص حرفين على الأقل." }),
});

const assignToBeneficiarySchema = z.object({
  beneficiaryId: z.string({ required_error: "الرجاء اختيار مستفيد." }),
});

type Mentor = UserProfile & {
  expertise?: string;
};


export default function OrgMentorsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { userProfile } = useUser();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [mentorToAssign, setMentorToAssign] = useState<Mentor | null>(null);
    
    // Get mentors assigned to THIS organization
    const orgMentorsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.organizationId) return null;
        return query(collection(firestore, "users"), where("role", "==", "mentor"), where("organizationId", "==", userProfile.organizationId));
    }, [firestore, userProfile?.organizationId]);
    const { data: orgMentors, loading: orgMentorsLoading } = useCollection<Mentor>(orgMentorsQuery);

    // Get ALL mentors on the platform to find unassigned ones
    const allMentorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), where("role", "==", "mentor"));
    }, [firestore]);
    const { data: allMentors, loading: allMentorsLoading } = useCollection<Mentor>(allMentorsQuery);

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.organizationId) return null;
        return query(collection(firestore, "users"), where("role", "==", "beneficiary"), where("organizationId", "==", userProfile.organizationId));
    }, [firestore, userProfile?.organizationId]);
    const { data: beneficiaries, loading: beneficiariesLoading } = useCollection<UserProfile>(beneficiariesQuery);

    const unassignedMentors = useMemo(() => {
        if (!allMentors) return [];
        return allMentors.filter(m => !m.organizationId);
    }, [allMentors]);

    const loading = orgMentorsLoading || allMentorsLoading || beneficiariesLoading;
    
    const form = useForm<z.infer<typeof addMentorSchema>>({
        resolver: zodResolver(addMentorSchema),
        defaultValues: { name: "", email: "", expertise: "" },
    });

    const assignForm = useForm<z.infer<typeof assignToBeneficiarySchema>>({
        resolver: zodResolver(assignToBeneficiarySchema),
    });

    async function handleAddMentor(values: z.infer<typeof addMentorSchema>) {
        if (!firestore || !userProfile?.organizationId) return;
        const newMentorData = {
            ...values,
            role: 'mentor',
            organizationId: userProfile.organizationId,
            status: 'نشط',
            createdAt: new Date().toISOString(),
        };

        addDoc(collection(firestore, "users"), newMentorData)
            .then(() => {
                toast({ title: "تمت الإضافة بنجاح!", description: `تمت إضافة المرشد ${values.name} إلى منظمتك.` });
                setIsAddDialogOpen(false);
                form.reset();
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشلت إضافة المرشد." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'create', requestResourceData: newMentorData }));
            });
    }

    async function handleAssignMentor(mentor: Mentor) {
        if (!firestore || !userProfile?.organizationId) return;
        const mentorRef = doc(firestore, 'users', mentor.id);

        updateDoc(mentorRef, { organizationId: userProfile.organizationId })
            .then(() => {
                toast({ title: "تم التعيين بنجاح!", description: `تم تعيين المرشد ${mentor.name} إلى منظمتك.` });
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل تعيين المرشد." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: mentorRef.path, operation: 'update', requestResourceData: { organizationId: userProfile.organizationId } }));
            });
    }

    async function handleAssignToBeneficiary(values: z.infer<typeof assignToBeneficiarySchema>) {
        if (!firestore || !mentorToAssign) return;
        const beneficiaryRef = doc(firestore, 'users', values.beneficiaryId);

        updateDoc(beneficiaryRef, { mentorId: mentorToAssign.id })
            .then(() => {
                toast({ title: "تم التعيين بنجاح!", description: `تم تعيين المرشد ${mentorToAssign.name} للمستفيد.` });
                setMentorToAssign(null);
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشل تعيين المرشد للمستفيد." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: beneficiaryRef.path, operation: 'update', requestResourceData: { mentorId: mentorToAssign.id } }));
            });
    }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle>المرشدون</CardTitle>
                  <CardDescription>
                  إدارة وتعيين المرشدين لمنظمتك.
                  </CardDescription>
              </div>
               <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                      <Button>
                          <UserPlus className="ml-2 h-4 w-4" />
                          إضافة أو تعيين مرشد
                      </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl" className="sm:max-w-lg">
                      <DialogHeader>
                          <DialogTitle>إدارة المرشدين</DialogTitle>
                          <DialogDescription>
                              إضافة مرشد جديد يدويًا أو تعيين مرشد مسجل بالفعل في المنصة.
                          </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="assign" className="pt-4">
                          <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="assign">تعيين مرشد مسجل</TabsTrigger>
                              <TabsTrigger value="add">إضافة مرشد جديد</TabsTrigger>
                          </TabsList>
                          <TabsContent value="assign">
                              <p className="text-sm text-muted-foreground my-4">اختر مرشدًا من القائمة لتعيينه إلى منظمتك.</p>
                              <ScrollArea className="h-60">
                                  <div className="space-y-2 pr-4">
                                      {unassignedMentors.length > 0 ? unassignedMentors.map(mentor => (
                                          <div key={mentor.id} className="flex items-center justify-between p-2 rounded-md border">
                                              <div className="flex items-center gap-2">
                                                  <Avatar className="h-8 w-8">
                                                      <AvatarImage src={mentor.avatarUrl || `https://picsum.photos/seed/${mentor.id}/40/40`} />
                                                      <AvatarFallback>{mentor.name?.charAt(0) || 'M'}</AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                      <p className="font-medium">{mentor.name || 'مرشد بلا اسم'}</p>
                                                      <p className="text-xs text-muted-foreground">{mentor.expertise || 'خبرة عامة'}</p>
                                                  </div>
                                              </div>
                                              <Button size="sm" onClick={() => handleAssignMentor(mentor)}>تعيين</Button>
                                          </div>
                                      )) : <p className="text-center text-muted-foreground py-8">لا يوجد مرشدون غير معينين حاليًا.</p>}
                                  </div>
                              </ScrollArea>
                          </TabsContent>
                          <TabsContent value="add">
                              <Form {...form}>
                                  <form onSubmit={form.handleSubmit(handleAddMentor)} className="space-y-4 pt-4">
                                      <FormField control={form.control} name="name" render={({ field }) => (
                                          <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="اسم المرشد" {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                       <FormField control={form.control} name="email" render={({ field }) => (
                                          <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input dir="ltr" placeholder="mentor@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                       <FormField control={form.control} name="expertise" render={({ field }) => (
                                          <FormItem><FormLabel>مجال الخبرة</FormLabel><FormControl><Input placeholder="ريادة الأعمال، التسويق الرقمي..." {...field} /></FormControl><FormMessage /></FormItem>
                                      )}/>
                                      <DialogFooter>
                                          <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                                          <Button type="submit">إضافة المرشد</Button>
                                      </DialogFooter>
                                  </form>
                              </Form>
                          </TabsContent>
                      </Tabs>
                  </DialogContent>
               </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>مجال الخبرة</TableHead>
                <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-32" /></TableCell>
                  </TableRow>
              ))}
              {!loading && orgMentors?.map((mentor) => {
                const mentorName = mentor.name || 'مرشد بلا اسم';
                return (
                <TableRow key={mentor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mentor.avatarUrl || `https://picsum.photos/seed/${mentor.id}/40/40`} alt={mentorName} />
                        <AvatarFallback>{mentorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{mentorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{mentor.expertise || 'خبرة عامة'}</TableCell>
                  <TableCell className="hidden md:table-cell">{mentor.email || '-'}</TableCell>
                  <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setMentorToAssign(mentor)}>
                          <User className="ml-2 h-4 w-4" />
                          تعيين لمستفيد
                      </Button>
                  </TableCell>
                </TableRow>
              )})}
              {!loading && (!orgMentors || orgMentors.length === 0) && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">لا يوجد مرشدون تابعون لهذه المنظمة.</TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!mentorToAssign} onOpenChange={(isOpen) => { if (!isOpen) setMentorToAssign(null) }}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>تعيين المرشد: {mentorToAssign?.name}</DialogTitle>
                <DialogDescription>اختر مستفيدًا لتعيين هذا المرشد له.</DialogDescription>
            </DialogHeader>
            <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(handleAssignToBeneficiary)} className="space-y-4 pt-4">
                     <FormField
                        control={assignForm.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>المستفيد</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر مستفيدًا..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {beneficiaries && beneficiaries.length > 0 ? 
                                            beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>) :
                                            <SelectItem value="loading" disabled>لا يوجد مستفيدون في منظمتك</SelectItem>
                                        }
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                        <Button type="submit">حفظ التعيين</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## File: src/app/organization-dashboard/messages/page.tsx

```tsx
"use client";

import { ChatInterface } from "@/components/chat-interface";

export default function OrgMessagesPage() {
  return (
    <ChatInterface 
      title="مركز رسائل المنظمة"
      description="التواصل مع المستفيدين والمشرفين."
    />
  );
}
```

---

## File: src/app/organization-dashboard/page.tsx

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, UserCheck, BarChart3, DollarSign } from "lucide-react"

export default function OrganizationDashboardPage() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم المنظمة</h1>
        <p className="text-muted-foreground">
          نظرة عامة على أداء المستفيدين في منظمتك.
        </p>
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المستفيدين
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المستفيدون النشطون
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
             لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التقدم</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي مبيعات المتاجر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 د.أ</div>
            <p className="text-xs text-muted-foreground">
              لا توجد بيانات
            </p>
          </CardContent>
        </Card>
      </div>
       <div className="grid grid-cols-1 gap-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>مرحبا بك في لوحة التحكم</CardTitle>
            <CardDescription>
              هنا يمكنك إدارة المستفيدين، المرشدين، الدورات، والتقارير الخاصة بمنظمتك.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}
```

---

## File: src/app/organization-dashboard/reports/page.tsx

```tsx

"use client"

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, Users, Activity, BarChart3, DollarSign } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EngagementData {
  month: string;
  active: number;
}

interface CompletionData {
  name: string;
  "معدل الإكمال": number;
}

interface SalesData {
  name: string;
  sales: number;
}

const engagementConfig = {
  active: { label: "مستفيد نشط", color: "hsl(var(--chart-1))" },
}

const completionConfig = {
  "معدل الإكمال": { label: "معدل الإكمال", color: "hsl(var(--chart-2))" },
}

const salesConfig = {
    sales: { label: "المبيعات", color: "hsl(var(--chart-1))" },
}

export default function OrgReportsPage() {
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    engagement: true,
    completion: true,
    sales: true,
  });

  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [completionData, setCompletionData] = useState<CompletionData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);


  const handleExport = (fullReport: boolean = false) => {
    const selectedReports = fullReport ? Object.keys(exportOptions) : Object.entries(exportOptions)
        .filter(([, isSelected]) => isSelected)
        .map(([reportName]) => reportName);

    if (selectedReports.length === 0) {
        toast({
            variant: "destructive",
            title: "لم يتم تحديد أي أجزاء",
            description: "الرجاء تحديد جزء واحد على الأقل من التقرير لتصديره.",
        });
        return;
    }

    toast({
      title: "جاري تصدير التقرير...",
      description: `سيتم تنزيل ${fullReport ? "التقرير الكامل" : "الأجزاء المحددة"} قريبًا.`,
    });
    setIsExportDialogOpen(false);
  }

  const handleCheckboxChange = (key: keyof typeof exportOptions) => {
    setExportOptions(prev => ({...prev, [key]: !prev[key]}));
  }

  return (
     <div className="space-y-8">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">تقارير المنظمة</h1>
                <p className="text-muted-foreground">
                تحليل أداء وتأثير المستفيدين في منظمتك.
                </p>
            </div>
             <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Download className="ml-2 h-4 w-4" />
                        تصدير التقارير
                    </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تصدير التقارير والتحليلات</DialogTitle>
                        <DialogDescription>اختر أجزاء التقرير التي ترغب في تصديرها.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="font-medium">أجزاء التقرير</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="engagement" checked={exportOptions.engagement} onCheckedChange={() => handleCheckboxChange("engagement")} />
                                <Label htmlFor="engagement">تفاعل المستفيدين</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="completion" checked={exportOptions.completion} onCheckedChange={() => handleCheckboxChange("completion")} />
                                <Label htmlFor="completion">معدلات إكمال الدورات</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox id="sales" checked={exportOptions.sales} onCheckedChange={() => handleCheckboxChange("sales")} />
                                <Label htmlFor="sales">مبيعات متاجر المستفيدين</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                        <Button variant="outline" onClick={() => handleExport(false)}>تصدير المحدد</Button>
                        <Button onClick={() => handleExport(true)}>تصدير التقرير الكامل</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
      </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المستفيدين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المستفيدون النشطون</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">0% من الإجمالي</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">التقدم العام للمسارات</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0%</div>
                    <p className="text-xs text-muted-foreground">متوسط إكمال الدورات</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إيرادات المتاجر</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0 د.أ</div>
                    <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
                </CardContent>
            </Card>
        </div>


       <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>تفاعل المستفيدين</CardTitle>
                    <CardDescription>عدد المستفيدين النشطين شهريًا.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={engagementConfig} className="h-[250px] w-full relative">
                        {engagementData.length === 0 ? (
                             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <LineChart accessibilityLayer data={engagementData} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Line dataKey="active" type="monotone" stroke="var(--color-active)" strokeWidth={2} dot={false} />
                            </LineChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>معدلات إكمال الدورات</CardTitle>
                    <CardDescription>معدل إكمال الدورات حسب الفئة.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={completionConfig} className="h-[250px] w-full relative">
                        {completionData.length === 0 ? (
                           <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                        ) : (
                            <BarChart accessibilityLayer data={completionData} margin={{ left: 10, right: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value}%`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="معدل الإكمال" fill="var(--color-معدل الإكمال)" radius={4} />
                            </BarChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>
       </div>
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>مبيعات متاجر المستفيدين</CardTitle>
                <CardDescription>أفضل المستفيدين أداءً من حيث المبيعات.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={salesConfig} className="h-[300px] w-full relative">
                    {salesData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                    ) : (
                        <BarChart accessibilityLayer data={salesData} margin={{ left: 10, right: 20 }}>
                                <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis orientation="right" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${value / 1000} ألف`} />
                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
```

---

## File: src/app/organization-dashboard/settings/page.tsx

```tsx
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
```

---

## File: src/app/organization-dashboard/stores/page.tsx

```tsx

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { DollarSign, Package, Users, BarChart } from "lucide-react";
import { slugify } from "@/lib/utils";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";


type Store = {
    id: string;
    beneficiaryId: string;
    name?: string;
    logoUrl?: string;
    beneficiaryName?: string;
    organizationId?: string;
}


export default function OrgStoresPage() {
  const firestore = useFirestore();
  const { userProfile, loading: userLoading } = useUser();

  const storesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organizationId) return null;
    return query(collection(firestore, "stores"), where("organizationId", "==", userProfile.organizationId));
  }, [firestore, userProfile]);

  const { data: stores, loading: storesLoading } = useCollection<Store>(storesQuery);

  const loading = userLoading || storesLoading;

  // Stats are reset. In a real app, this data would be aggregated or fetched.
  const stats = {
      revenue: "0",
      products: 0,
      customers: 0,
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">متاجر المستفيدين</h1>
        <p className="text-muted-foreground">
          مراقبة أداء المتاجر التي يديرها المستفيدون في منظمتك.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
         {loading && [...Array(2)].map((_, i) => (
            <Card key={i} className="flex flex-col md:flex-row">
                <div className="md:w-1/3"><Skeleton className="aspect-square h-full w-full" /></div>
                <div className="md:w-2/3 flex flex-col p-6">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                    <div className="flex-grow mt-4 grid grid-cols-3 gap-4">
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                    </div>
                    <Skeleton className="h-10 w-full mt-4" />
                </div>
            </Card>
         ))}
        {!loading && stores?.map((store) => {
          const storeName = store.name || "متجر غير مسمى";
          return (
            <Card key={store.id} className="flex flex-col md:flex-row">
                <div className="md:w-1/3">
                    <Image src={store.logoUrl || `https://picsum.photos/seed/${store.id}/400/400`} alt={storeName} width={400} height={400} className="rounded-t-lg md:rounded-r-lg md:rounded-l-none object-cover h-full" />
                </div>
                <div className="md:w-2/3 flex flex-col">
                <CardHeader>
                    <CardTitle>{storeName}</CardTitle>
                    <CardDescription>المستفيد: {store.beneficiaryName || store.beneficiaryId}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col items-center gap-1">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{stats.revenue} د.أ</span>
                        <span className="text-xs text-muted-foreground">الإيرادات</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{stats.products}</span>
                        <span className="text-xs text-muted-foreground">منتج</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{stats.customers}</span>
                        <span className="text-xs text-muted-foreground">عميل</span>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto">
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/stores/${slugify(storeName)}`}>
                            <BarChart className="ml-2 h-4 w-4" />
                            عرض المتجر
                        </Link>
                    </Button>
                </CardFooter>
                </div>
            </Card>
          )
        })}
         {!loading && (!stores || stores.length === 0) && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">لا توجد متاجر لعرضها.</p>
              </div>
          )}
      </div>
    </div>
  );
}
```

---

## File: src/app/organization-dashboard/team/page.tsx

```tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, PlusCircle, Download, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, addDoc, doc, deleteDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { useUser, type UserProfile } from "@/firebase/auth/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';



const formSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  role: z.string({ required_error: "الرجاء اختيار دور." }),
});

const roleMap: { [key: string]: string } = {
    organization: "مدير منظمة",
    team_member: "عضو فريق",
};

export default function TeamPage() {
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<UserProfile | null>(null);
    const firestore = useFirestore();
    const { userProfile } = useUser();
    const ORG_ID = userProfile?.organizationId;

    const teamQuery = useMemoFirebase(() => {
        if (!firestore || !ORG_ID) return null;
        return query(collection(firestore, "users"), where("organizationId", "==", ORG_ID), where("role", "in", ["organization", "team_member"]));
    }, [firestore, ORG_ID]);

    const { data: team, loading } = useCollection<UserProfile>(teamQuery);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "" },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if(!firestore || !ORG_ID) return;
        const newMemberData = { ...values, organizationId: ORG_ID, status: "نشط" };
        const usersCollection = collection(firestore, "users");

        addDoc(usersCollection, newMemberData)
            .then(() => {
                toast({ title: "تم بنجاح!", description: `تمت إضافة "${values.name}" إلى فريق العمل.` });
                form.reset();
                setIsAddDialogOpen(false);
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشلت إضافة العضو." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: usersCollection.path, operation: 'create', requestResourceData: newMemberData }));
            });
    }
    
    const handleExport = () => {
        toast({ title: "جاري تصدير قائمة الفريق...", description: "سيتم تنزيل ملف CSV قريبًا." });
    }

    const handleDelete = () => {
        if (!memberToDelete || !firestore) return;
        const memberRef = doc(firestore, 'users', memberToDelete.id);
        deleteDoc(memberRef)
            .then(() => {
                toast({ variant: "destructive", title: "تمت الإزالة!", description: `تمت إزالة "${memberToDelete.name}" من الفريق.` });
                setMemberToDelete(null);
            })
            .catch(err => {
                toast({ variant: "destructive", title: "خطأ!", description: "فشلت إزالة العضو." });
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: memberRef.path, operation: 'delete' }));
                setMemberToDelete(null);
            });
    }

  return (
    <>
     <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>فريق العمل</CardTitle>
                <CardDescription>
                إدارة أعضاء فريق منظمتك وأدوارهم.
                </CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            إضافة عضو
                        </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة عضو جديد للفريق</DialogTitle>
                            <DialogDescription>
                                أدخل معلومات العضو الجديد وأرسل له دعوة.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="مثال: خالد الأحمد" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input dir="ltr" placeholder="khaled@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="role" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الدور</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر دورًا" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="organization">مدير منظمة</SelectItem>
                                                <SelectItem value="team_member">عضو فريق</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <DialogFooter>
                                    <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                                    <Button type="submit">إرسال دعوة</Button>
                                 </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                 </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && [...Array(3)].map((_, i) => (
                 <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-[150px]" /></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[60px] mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
            {!loading && team?.map((user) => {
              const userName = user.name || 'عضو فريق بلا اسم';
              return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`} alt={userName} />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{userName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                <TableCell>{roleMap[user.role || ''] || user.role || 'غير محدد'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={user.status === "نشط" ? "default" : "secondary"}>
                    {user.status || 'غير محدد'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">قائمة</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => toast({ title: "سيتم فتح نافذة تعديل الدور قريبًا."})}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل الدور
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onSelect={(e) => { e.preventDefault(); setMemberToDelete(user);}}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        إزالة من الفريق
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
            {!loading && (!team || team.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">لا يوجد أعضاء في الفريق.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
     <AlertDialog open={!!memberToDelete} onOpenChange={(isOpen) => !isOpen && setMemberToDelete(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء سيقوم بإزالة "{memberToDelete?.name || 'العضو'}" من فريق العمل.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>نعم، قم بالإزالة</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
   </>
  );
}
```

---

## File: src/app/page.tsx

```tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { ArrowLeft, BookOpen, Users, Store, Building, GraduationCap, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="text-center transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="pt-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const RoleCard = ({ icon, title, description, link }: { icon: React.ReactNode, title: string, description: string, link: string }) => (
    <Card className="text-center flex flex-col group">
        <CardHeader>
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent text-accent-foreground mx-auto mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {icon}
            </div>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <CardDescription>{description}</CardDescription>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={link}>ابدأ الآن <ArrowLeft className="mr-2 h-4 w-4" /></Link>
            </Button>
        </CardFooter>
    </Card>
);


export default function LandingPage() {
    const heroImage = PlaceHolderImages.find((image) => image.id === 'landing-hero');

    return (
        <div className="bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <Logo />
                        <span>EmpowerHub</span>
                    </Link>
                    <nav className="flex-1 mr-6 hidden md:flex gap-6 text-sm font-medium">
                        <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">الميزات</Link>
                        <Link href="#roles" className="text-muted-foreground transition-colors hover:text-foreground">انضم إلينا</Link>
                        <Link href="/market" className="text-muted-foreground transition-colors hover:text-foreground">المتجر</Link>
                        <Link href="/try-roles" className="text-muted-foreground transition-colors hover:text-foreground">تجربة المنصة</Link>
                    </nav>
                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant="outline" asChild>
                            <Link href="/login">تسجيل الدخول</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/register">إنشاء حساب</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative flex h-[80vh] min-h-[600px] items-center justify-center text-center text-white">
                    {heroImage && (
                        <Image
                            src={heroImage.imageUrl}
                            alt={heroImage.description}
                            fill
                            className="object-cover"
                            data-ai-hint={heroImage.imageHint}
                            priority
                        />
                    )}
                    <div className="absolute inset-0 bg-black/60" /> {/* Overlay */}
                    <div className="relative z-10 container px-4 md:px-6">
                        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                            EmpowerHub
                            <span className="block mt-2">بوابتك للتمكين والنجاح</span>
                        </h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-primary-foreground/90">
                            منصة متكاملة تجمع بين التدريب، الإرشاد، والتجارة الإلكترونية لمساعدتك على بناء مستقبلك.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <Button size="lg" asChild>
                                <Link href="/register">ابدأ رحلتك الآن</Link>
                            </Button>
                            <Button size="lg" variant="secondary" asChild>
                                <Link href="/market">تصفح متجر المستفيدين</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-12 md:py-24">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight">كل ما تحتاجه للنجاح في مكان واحد</h2>
                            <p className="mt-2 text-lg text-muted-foreground">نقدم لك الأدوات والموارد اللازمة لتنمية مهاراتك وتحقيق أهدافك.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={<BookOpen size={32} />} 
                                title="تدريب متخصص" 
                                description="مسارات تعليمية ودورات تدريبية مصممة لتزويدك بالمهارات المطلوبة في سوق العمل."
                            />
                            <FeatureCard 
                                icon={<Users size={32} />} 
                                title="إرشاد شخصي" 
                                description="تواصل مع مرشدين وخبراء لمساعدتك في رحلتك، وتقديم النصح والتوجيه المخصص لك."
                            />
                            <FeatureCard 
                                icon={<Store size={32} />} 
                                title="متجر إلكتروني" 
                                description="أنشئ متجرك الخاص، اعرض منتجاتك، وابدأ في تحقيق الدخل من مشروعك بسهولة."
                            />
                        </div>
                    </div>
                </section>

                {/* Roles CTA Section */}
                <section id="roles" className="py-12 md:py-24 bg-muted/50">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight">انضم إلى مجتمعنا اليوم</h2>
                            <p className="mt-2 text-lg text-muted-foreground">سواء كنت مستفيدًا، مرشدًا، أو منظمة، هناك مكان لك في EmpowerHub.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <RoleCard 
                                icon={<UserCheck size={32} />}
                                title="كمستفيد"
                                description="طور مهاراتك، ابنِ مشروعك، وحقق استقلاليتك المالية."
                                link="/register?role=beneficiary"
                            />
                            <RoleCard 
                                icon={<GraduationCap size={32} />}
                                title="كمدرب"
                                description="شارك خبراتك ومعرفتك من خلال إنشاء وتقديم دورات تدريبية."
                                link="/register?role=coach"
                            />
                             <RoleCard 
                                icon={<Users size={32} />}
                                title="كمرشد"
                                description="ساهم في نجاح الآخرين من خلال تقديم الإرشاد والتوجيه الشخصي."
                                link="/register?role=mentor"
                            />
                            <RoleCard 
                                icon={<Building size={32} />}
                                title="كمنظمة"
                                description="أدر برامج التمكين الخاصة بك، وتابع تقدم المستفيدين بفعالية."
                                link="/register?role=organization"
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-6 border-t">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Logo className="h-6 w-6" />
                        <span>© 2024 EmpowerHub. جميع الحقوق محفوظة.</span>
                    </div>
                    <nav className="flex gap-4 text-sm font-medium">
                        <Link href="#" className="text-muted-foreground hover:text-foreground">سياسة الخصوصية</Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground">شروط الاستخدام</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
```

---

## File: src/app/register/page.tsx

```tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useFirebaseApp } from '@/firebase/provider';


const formSchema = z.object({
    name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
    email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
    password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
    role: z.string({ required_error: "الرجاء اختيار دور." }),
});

export default function RegisterPage() {
    const registerImage = PlaceHolderImages.find((image) => image.id === 'register-background');
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const app = useFirebaseApp();
    const [isLoading, setIsLoading] = useState(false);

    const roleFromQuery = searchParams.get('role');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: roleFromQuery && ["beneficiary", "coach", "mentor", "organization"].includes(roleFromQuery) ? roleFromQuery : "beneficiary",
        },
    });

    useEffect(() => {
        const role = searchParams.get('role');
        if (role) {
            form.setValue('role', role);
        }
    }, [searchParams, form]);
    
    const getDashboardLink = (role: string) => {
        switch (role) {
            case 'organization':
                return '/organization-dashboard';
            case 'admin':
                return '/admin-dashboard';
            case 'mentor':
                return '/mentor-dashboard';
            case 'coach':
                return '/coach-dashboard';
            case 'beneficiary':
            default:
                return '/dashboard';
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            if (!app) throw new Error("Firebase app is not initialized.");
            const auth = getAuth(app);
            const firestore = getFirestore(app);

            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await setDoc(doc(firestore, "users", user.uid), {
                name: values.name,
                email: values.email,
                role: values.role,
                status: "نشط",
                createdAt: new Date().toISOString(),
                id: user.uid,
            });

            toast({
                title: "تم إنشاء الحساب بنجاح!",
                description: "تم تسجيل دخولك تلقائيًا.",
            });

            const dashboardUrl = getDashboardLink(values.role);
            router.push(dashboardUrl);

        } catch (error: any) {
            console.error("Registration error", error);
            const errorCode = error.code;
            let errorMessage = "فشل إنشاء الحساب. الرجاء المحاولة مرة أخرى.";
            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل.";
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = "كلمة المرور ضعيفة جدًا.";
            }
            toast({
                variant: "destructive",
                title: "حدث خطأ",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <Link href="/" className="flex justify-center items-center gap-2">
                           <Logo className="w-16 h-16 mx-auto" />
                        </Link>
                        <h1 className="text-3xl font-bold">إنشاء حساب جديد</h1>
                        <p className="text-balance text-muted-foreground">
                            أدخل معلوماتك أدناه لإنشاء حسابك
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="text-right">
                                        <FormLabel>الاسم الكامل</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="text-right">
                                        <FormLabel>البريد الإلكتروني</FormLabel>
                                        <FormControl>
                                            <Input type="email" dir="ltr" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="text-right">
                                        <FormLabel>كلمة المرور</FormLabel>
                                        <FormControl>
                                            <Input type="password" dir="ltr" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="text-right">
                                        <FormLabel>الانضمام كـ</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!roleFromQuery}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر دورًا لحسابك" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="beneficiary">مستفيد</SelectItem>
                                                <SelectItem value="coach">مدرب</SelectItem>
                                                <SelectItem value="mentor">مرشد</SelectItem>
                                                <SelectItem value="organization">مدير منظمة</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-4 text-center text-sm">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="underline">
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block relative">
                {registerImage && (
                    <Image
                        src={registerImage.imageUrl}
                        alt={registerImage.description}
                        width={1200}
                        height={900}
                        className="h-full w-full object-cover"
                        data-ai-hint={registerImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
        </div>
    );
}
```

---

## File: src/app/stores/[storeId]/page.tsx

```tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { OrderDialog } from "@/components/order-dialog";
import { ArrowRight, ShoppingCart, MapPin } from "lucide-react";
import { slugify } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/lib/products-data";


type Store = {
    id: string;
    beneficiaryId: string;
    name?: string;
    logoUrl?: string;
    beneficiaryName?: string;
    location?: string;
}

export default function StorePage({ params }: { params: { storeId: string } }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const firestore = useFirestore();

  // Fetch all stores to find the one matching the slug
  const allStoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'stores'));
  }, [firestore]);

  const { data: allStores, loading: storesLoading } = useCollection<Store>(allStoresQuery);

  const store = useMemo(() => {
    if (!allStores) return null;
    return allStores.find(s => slugify(s.name || '') === params.storeId);
  }, [allStores, params.storeId]);

  // Fetch products for the found store's beneficiary
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !store) return null;
    return query(collection(firestore, "products"), where("beneficiaryId", "==", store.beneficiaryId));
  }, [firestore, store]);

  const { data: products, loading: productsLoading } = useCollection<Product>(productsQuery);

  const loading = storesLoading || productsLoading;
  const storeName = store?.name || "متجر غير مسمى";
  const beneficiaryName = store?.beneficiaryName || "غير معروف";
  const location = store?.location || "غير محدد";

  if (loading) {
     return (
        <>
            <header className="py-4 px-6 border-b bg-card">
                 <div className="container mx-auto flex items-center justify-between">
                     <Skeleton className="h-6 w-40" />
                     <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-5 w-48" />
                             <Skeleton className="h-4 w-24" />
                        </div>
                     </div>
                 </div>
            </header>
            <main className="container mx-auto py-8 px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-[300px]" /></CardContent></Card>
                ))}
                </div>
            </main>
        </>
     )
  }

  if (!store) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">المتجر غير موجود</h1>
            <p className="text-muted-foreground">عذراً، لا يمكننا العثور على هذا المتجر.</p>
            <Button asChild className="mt-4">
                <Link href="/market">العودة إلى المتجر العام</Link>
            </Button>
        </div>
    )
  }

  return (
    <>
      <header className="py-4 px-6 border-b bg-card">
        <div className="container mx-auto flex items-center justify-between">
            <Link href="/market" className="flex items-center gap-2 text-primary hover:underline">
                <ArrowRight className="h-4 w-4" />
                <span>العودة للمتجر العام</span>
            </Link>
            <div className="flex items-center gap-3">
                 <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/${params.storeId}/40/40`} alt={beneficiaryName} />
                    <AvatarFallback>{beneficiaryName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{storeName}</h1>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>بإدارة {beneficiaryName} من {location}</span>
                  </div>
                </div>
            </div>
        </div>
      </header>
      <main className="container mx-auto py-8 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {!products || products.length === 0 ? (
                <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">لا توجد منتجات في هذا المتجر حاليًا.</p>
                </div>
            ) : products.map((product) => (
                <Card key={product.id} className="overflow-hidden group flex flex-col">
                    <CardHeader className="p-0">
                        <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} width={400} height={300} className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105" />
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                         <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">{product.description}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            المخزون: {product.stock}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center p-4 pt-0 mt-auto">
                        <p className="text-lg font-semibold">{product.price.toFixed(2)} د.أ</p>
                        <Button size="sm" onClick={() => setSelectedProduct(product)}>
                            <ShoppingCart className="ml-2 h-4 w-4" />
                            اطلب الآن
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </main>
      <OrderDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={(open) => {
            if(!open) setSelectedProduct(null);
        }}
      />
    </>
  );
}
```

---

## File: src/app/try-roles/page.tsx

```tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Building, Users, GraduationCap, UserCheck, ArrowLeft } from 'lucide-react';

const roles = [
  {
    icon: <Shield size={32} />,
    title: "مشرف عام",
    description: "إدارة كاملة للمنصة، بما في ذلك المنظمات والمستخدمين وصحة النظام.",
    link: "/admin-dashboard"
  },
  {
    icon: <Building size={32} />,
    title: "مدير منظمة",
    description: "إدارة المستفيدين، المرشدين، الدورات، والتقارير الخاصة بمنظمتك.",
    link: "/organization-dashboard"
  },
  {
    icon: <UserCheck size={32} />,
    title: "مستفيد",
    description: "الوصول إلى الدورات التدريبية، جلسات الإرشاد، وإدارة متجرك الخاص.",
    link: "/dashboard"
  },
  {
    icon: <Users size={32} />,
    title: "مرشد",
    description: "متابعة المستفيدين، جدولة الجلسات، وتقديم التوجيه والدعم.",
    link: "/mentor-dashboard"
  },
  {
    icon: <GraduationCap size={32} />,
    title: "مدرب",
    description: "إنشاء وإدارة الدورات التدريبية، ومتابعة أداء الطلاب.",
    link: "/coach-dashboard"
  }
];

const RoleCard = ({ icon, title, description, link }: { icon: React.ReactNode, title: string, description: string, link: string }) => (
    <Card className="text-center flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1">
        <CardHeader>
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent text-accent-foreground mx-auto mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {icon}
            </div>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <CardDescription>{description}</CardDescription>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={link}>عرض لوحة التحكم <ArrowLeft className="mr-2 h-4 w-4" /></Link>
            </Button>
        </CardFooter>
    </Card>
);


export default function TryRolesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">تجربة المنصة</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          اختر أحد الأدوار أدناه لتصفح لوحة التحكم الخاصة به وتجربة الميزات المتاحة.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full max-w-7xl">
          {roles.map(role => (
              <RoleCard key={role.title} {...role} />
          ))}
      </div>

       <div className="mt-12">
            <Button variant="outline" asChild>
                <Link href="/">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة إلى الصفحة الرئيسية
                </Link>
            </Button>
        </div>
    </div>
  );
}
```

---

## File: src/components/FirebaseErrorListener.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
 */
export function FirebaseErrorListener() {
  // Use the specific error type for the state for type safety.
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      // Set error in state to trigger a re-render.
      setError(error);
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render, if an error exists in state, throw it.
  if (error) {
    throw error;
  }

  // This component renders nothing.
  return null;
}
```

---

## File: src/components/chat-interface.tsx

```tsx

"use client";

import { useState, useMemo, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { query, collection, where, orderBy, doc, getDoc, addDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { sendNotification } from '@/lib/notifications';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp?: Timestamp;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated?: Timestamp;
}

type ConversationWithDetails = Conversation & {
    otherUser: Partial<UserProfile>;
};

interface ChatInterfaceProps {
  title: string;
  description: string;
}

export function ChatInterface({ title, description }: ChatInterfaceProps) {
  const { user: authUser, userProfile } = useUser();
  const firestore = useFirestore();

  const [conversationsWithDetails, setConversationsWithDetails] = useState<ConversationWithDetails[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // 1. Fetch conversations for the current user
  const conversationsQuery = useMemoFirebase(() => {
    if (!authUser) return null;
    return query(collection(firestore, "conversations"), where("participants", "array-contains", authUser.uid), orderBy("lastUpdated", "desc"));
  }, [firestore, authUser]);
  const { data: conversations, loading: conversationsLoading } = useCollection<Conversation>(conversationsQuery);

  // 2. When conversations are fetched, fetch details of the other participants
  useEffect(() => {
    if (!conversations || !authUser || !firestore) {
        if (!conversationsLoading) {
            setConversationsWithDetails([]);
            setConvLoading(false);
        }
        return;
    };
    setConvLoading(true);

    const fetchParticipantDetails = async () => {
        const conversationsPromises = conversations.map(async (convo) => {
            const otherUserId = convo.participants.find(p => p !== authUser.uid);
            if (!otherUserId) {
                return { ...convo, otherUser: { name: "Unknown Group", avatarUrl: '' } };
            }
            const userDocRef = doc(firestore, "users", otherUserId);
            const userDocSnap = await getDoc(userDocRef);
            const otherUser = userDocSnap.exists() ? { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile : { name: "Unknown User", avatarUrl: '', id: otherUserId };
            return { ...convo, otherUser };
        });
        const resolvedConversations = await Promise.all(conversationsPromises);
        setConversationsWithDetails(resolvedConversations as ConversationWithDetails[]);
        setConvLoading(false);
    }
    
    fetchParticipantDetails();

}, [conversations, authUser, firestore, conversationsLoading]);


  // 3. Auto-select the first conversation
  useEffect(() => {
    if (!selectedConversationId && conversationsWithDetails.length > 0) {
        setSelectedConversationId(conversationsWithDetails[0].id);
    }
  }, [conversationsWithDetails, selectedConversationId]);
  
  const selectedConversation = useMemo(() => conversationsWithDetails.find(c => c.id === selectedConversationId), [conversationsWithDetails, selectedConversationId]);

  // 4. Fetch messages for the selected conversation
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedConversationId) return null;
    return query(collection(firestore, "conversations", selectedConversationId, "messages"), orderBy("timestamp", "asc"));
  }, [firestore, selectedConversationId]);
  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery);
  
  // 5. Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversation || !authUser || !firestore) return;

    const messagesColRef = collection(firestore, "conversations", selectedConversation.id, "messages");
    const convoRef = doc(firestore, "conversations", selectedConversation.id);

    const messageData = {
        senderId: authUser.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
    };
    
    setNewMessage('');

    await addDoc(messagesColRef, messageData);
    await updateDoc(convoRef, {
        lastMessage: newMessage,
        lastUpdated: serverTimestamp(),
    });
    
    if (selectedConversation.otherUser.id && userProfile) {
        sendNotification(firestore, {
            userId: selectedConversation.otherUser.id,
            title: `رسالة جديدة من ${userProfile.name}`,
            description: newMessage,
            link: '/messages' // A generic link, could be improved
        });
    }

  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)] md:h-[650px]">
          {/* Conversations List */}
          <div className="col-span-1 border-l rounded-lg">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {convLoading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                {!convLoading && conversationsWithDetails.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConversationId(convo.id)}
                    className={cn(
                      'w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors',
                      selectedConversationId === convo.id ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={convo.otherUser.avatarUrl || `https://picsum.photos/seed/${convo.otherUser.id}/40/40`} alt={convo.otherUser.name} />
                      <AvatarFallback>{convo.otherUser.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <p className="font-semibold">{convo.otherUser.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col border rounded-lg">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.otherUser.avatarUrl || `https://picsum.photos/seed/${selectedConversation.otherUser.id}/40/40`} alt={selectedConversation.otherUser.name} />
                    <AvatarFallback>{selectedConversation.otherUser.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{selectedConversation.otherUser.name}</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messagesLoading && <p>جاري تحميل الرسائل...</p>}
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex items-end gap-2',
                          msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {msg.senderId !== authUser?.uid && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedConversation.otherUser.avatarUrl || `https://picsum.photos/seed/${selectedConversation.otherUser.id}/40/40`} alt={selectedConversation.otherUser.name} />
                            <AvatarFallback>{selectedConversation.otherUser.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'p-3 rounded-lg max-w-xs lg:max-w-md break-words',
                             msg.senderId === authUser?.uid
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm">{msg.text}</p>
                           <p className={cn("text-xs mt-1", msg.senderId === authUser?.uid ? "text-primary-foreground/70 text-left" : "text-muted-foreground/70 text-right")}>
                                {msg.timestamp?.toDate().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) || 'الآن'}
                           </p>
                        </div>
                         {msg.senderId === authUser?.uid && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userProfile?.avatarUrl || `https://picsum.photos/seed/${authUser?.uid}/40/40`} alt={userProfile?.name} />
                            <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background/95">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center flex-col gap-2">
                 <MessageSquare className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">اختر محادثة لبدء الدردشة.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## File: src/components/evaluation-dialog.tsx

```tsx
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const evaluationSchema = z.object({
  rating: z.number().min(1, { message: 'التقييم مطلوب.' }).max(5),
  comment: z.string().optional(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

interface EvaluationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  evaluatorId: string;
  evaluatedId: string;
  evaluatedName: string;
  type: 'mentor_to_beneficiary' | 'beneficiary_to_mentor';
}

export function EvaluationDialog({
  isOpen,
  onOpenChange,
  sessionId,
  evaluatorId,
  evaluatedId,
  evaluatedName,
  type,
}: EvaluationDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const rating = form.watch('rating');

  const onSubmit = async (values: EvaluationFormValues) => {
    if (!firestore) return;
    const evaluationData = {
      ...values,
      sessionId,
      evaluatorId,
      evaluatedId,
      type,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'evaluations'), evaluationData);
      toast({
        title: 'تم إرسال التقييم',
        description: `شكرًا لك على تقييم ${evaluatedName}.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ!',
        description: 'لم نتمكن من حفظ تقييمك.',
      });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'evaluations',
        operation: 'create',
        requestResourceData: evaluationData,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تقييم الجلسة</DialogTitle>
          <DialogDescription>
            شاركنا رأيك حول الجلسة مع {evaluatedName}. تقييمك يساعدنا على التحسين.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التقييم العام</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-8 w-8 cursor-pointer transition-colors',
                            (hoverRating >= star || rating >= star)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          )}
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="هل لديك أي ملاحظات أخرى تود مشاركتها؟" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">إلغاء</Button>
              </DialogClose>
              <Button type="submit">إرسال التقييم</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## File: src/components/logo.tsx

```tsx
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-auto", className)}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_303_3)">
        <path
          d="M31.6667 0H8.33333C3.75 0 0 3.75 0 8.33333V31.6667C0 36.25 3.75 40 8.33333 40H31.6667C36.25 40 40 36.25 40 31.6667V8.33333C40 3.75 36.25 0 31.6667 0Z"
          fill="hsl(var(--primary))"
        />
        <path
          d="M11.666 11.666V28.3327H15.6247V21.416H24.3747V28.3327H28.3333V11.666H24.3747V18.5827H15.6247V11.666H11.666Z"
          fill="hsl(var(--primary-foreground))"
        />
      </g>
      <defs>
        <clipPath id="clip0_303_3">
          <rect width="40" height="40" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
```

---

## File: src/components/notification-bell.tsx

```tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy, doc, writeBatch } from 'firebase/firestore';
import { Bell, BellRing } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type Notification = {
    id: string;
    title: string;
    description: string;
    link: string;
    isRead: boolean;
    createdAt: any; // Firestore Timestamp
}

export function NotificationBell() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);

    const notificationsQuery = useMemoFirebase(() => {
        if (!authUser || !firestore) return null;
        return query(
            collection(firestore, "notifications"), 
            where("userId", "==", authUser.uid), 
            orderBy("createdAt", "desc")
        );
    }, [authUser, firestore]);

    const { data: notifications } = useCollection<Notification>(notificationsQuery);

    const unreadCount = useMemo(() => {
        return notifications?.filter(n => !n.isRead).length || 0;
    }, [notifications]);

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (open || !notifications || unreadCount === 0 || !firestore) return;

        // Mark all as read when dropdown is closed
        const batch = writeBatch(firestore);
        notifications.forEach(n => {
            if (!n.isRead) {
                const notifRef = doc(firestore, 'notifications', n.id);
                batch.update(notifRef, { isRead: true });
            }
        });
        await batch.commit().catch(console.error);
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 relative">
                    {unreadCount > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    <span className="sr-only">الإشعارات</span>
                    {unreadCount > 0 && (
                         <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">{unreadCount}</span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" dir="rtl">
                <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">الإشعارات</p>
                        {unreadCount > 0 && <Badge>{unreadCount} جديد</Badge>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map(n => (
                         <DropdownMenuItem key={n.id} asChild className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                            <Link href={n.link || '#'}>
                                <div className='flex justify-between w-full'>
                                    <p className="font-medium">{n.title}</p>
                                    {n.createdAt && <p className='text-xs text-muted-foreground'>{formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true, locale: ar })}</p>}
                                </div>
                                <p className="text-xs text-muted-foreground w-full">{n.description}</p>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                     <DropdownMenuItem className="justify-center" disabled>لا توجد إشعارات</DropdownMenuItem>
                )}
                
                {notifications && notifications.length > 5 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                            عرض كل الإشعارات
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

---

## File: src/components/order-dialog.tsx

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@/lib/products-data";
import { useFirestore } from "@/firebase/provider";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const orderFormSchema = z.object({
  name: z.string().min(2, { message: "يجب إدخال اسم صحيح." }),
  address: z.string().min(10, { message: "يجب إدخال عنوان لا يقل عن 10 أحرف." }),
  phone: z.string().regex(/^[\d\s\-\+]+$/, { message: "الرجاء إدخال رقم هاتف صحيح." }),
});

type OrderDialogProps = {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDialog({ product, isOpen, onOpenChange }: OrderDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  const total = (product?.price || 0) + (product?.deliveryCost || 0);

  async function onSubmit(values: z.infer<typeof orderFormSchema>) {
    if (!product || !firestore) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "لا يمكن إتمام الطلب الآن.",
        });
        return;
    }

    const orderData = {
        customerName: values.name,
        customerAddress: values.address,
        customerPhone: values.phone,
        productId: product.id,
        productName: product.name,
        beneficiaryId: product.beneficiaryId,
        orderDate: serverTimestamp(),
        status: "pending" as const,
    };
    
    try {
        await addDoc(collection(firestore, "orders"), orderData);
        toast({
            title: "تم استلام طلبك بنجاح!",
            description: `شكرًا لك، ${values.name}. سيتم توصيل منتج "${product?.name}" إلى عنوانك قريبًا.`,
        });
        form.reset();
        onOpenChange(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "خطأ في إرسال الطلب",
            description: "لم نتمكن من حفظ طلبك. الرجاء المحاولة مرة أخرى.",
        });
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'orders',
            operation: 'create',
            requestResourceData: orderData,
        }));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب المنتج: {product?.name}</DialogTitle>
          <DialogDescription as="div" className="space-y-1 text-right">
            <p>{product?.description}</p>
            <p><b>السعر:</b> {product?.price.toFixed(2)} د.أ</p>
            {product?.deliveryCost && product.deliveryCost > 0 && (
                <p><b>تكلفة التوصيل:</b> {product.deliveryCost.toFixed(2)} د.أ</p>
            )}
            <p className="border-t pt-2 mt-2 font-bold"><b>الإجمالي:</b> {total.toFixed(2)} د.أ</p>
            <p><b>البائع:</b> {product?.beneficiaryName} ({product?.location})</p>
            <p className="pt-3 font-semibold">الرجاء إدخال معلومات التوصيل لإكمال عملية الشراء.</p>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="اسمك الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان التوصيل</FormLabel>
                  <FormControl>
                    <Input placeholder="المدينة، الحي، الشارع، رقم المبنى" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input dir="ltr" placeholder="+962 7X XXX XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">تأكيد الطلب</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## File: src/components/ui/accordion.tsx

```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-gray-300 dark:border-gray-700", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-semibold transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

---

## File: src/components/ui/alert-dialog.tsx

```tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

---

## File: src/components/ui/alert.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```

---

## File: src/components/ui/avatar.tsx

```tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
```

---

## File: src/components/ui/badge.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

---

## File: src/components/ui/button.tsx

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

## File: src/components/ui/calendar.tsx

```tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
```

---

## File: src/components/ui/card.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

## File: src/components/ui/carousel.tsx

```tsx
"use client"

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
```

---

## File: src/components/ui/chart.tsx

```tsx
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
```

---

## File: src/components/ui/checkbox.tsx

```tsx
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

---

## File: src/components/ui/collapsible.tsx

```tsx
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
```

---

## File: src/components/ui/dialog.tsx

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

---

## File: src/components/ui/dropdown-menu.tsx

```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
```

---

## File: src/components/ui/form.tsx

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
```

---

## File: src/components/ui/input.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

---

## File: src/components/ui/label.tsx

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

---

## File: src/components/ui/menubar.tsx

```tsx
"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
```

---

## File: src/components/ui/popover.tsx

```tsx
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```

---

## File: src/components/ui/progress.tsx

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

---

## File: src/components/ui/radio-group.tsx

```tsx
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
```

---

## File: src/components/ui/scroll-area.tsx

```tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

---

## File: src/components/ui/select.tsx

```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

---

## File: src/components/ui/separator.tsx

```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

---

## File: src/components/ui/sheet.tsx

```tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

---

## File: src/components/ui/sidebar.tsx

```tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
```

---

## File: src/components/ui/skeleton.tsx

```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

---

## File: src/components/ui/slider.tsx

```tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

---

## File: src/components/ui/switch.tsx

```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

---

## File: src/components/ui/table.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

---

## File: src/components/ui/tabs.tsx

```tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

---

## File: src/components/ui/textarea.tsx

```tsx
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
```

---

## File: src/components/ui/toast.tsx

```tsx
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

---

## File: src/components/ui/toaster.tsx

```tsx
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

---

## File: src/components/ui/tooltip.tsx

```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

---

## File: src/firebase/auth/use-user.tsx

```tsx
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

export type UserProfile = DocumentData & {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  avatarUrl?: string;
  mentorId?: string;
  coachId?: string;
  expertise?: string;
  progress?: number;
  status?: "نشط" | "غير نشط" | "مكتمل" | "جديد";
  category?: string;
};

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user || !firestore) {
      if (!user) setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user, firestore]);

  return { user, userProfile, loading };
}
```

---

## File: src/firebase/client-provider.tsx

```tsx
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
// Import directly from the new client-only file
import { initializeFirebaseSDKs } from '@/firebase/client';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // This now calls the function from the completely isolated module.
    return initializeFirebaseSDKs();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
```

---

## File: src/firebase/client.ts

```ts
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase on the client side and returns the services.
 * This function should only be called from within a client component.
 */
export function initializeFirebaseSDKs() {
  const firebaseApp: FirebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

  const auth: Auth = getAuth(firebaseApp);
  
  let firestore: Firestore | null = null;
  try {
    firestore = getFirestore(firebaseApp);
  } catch (e) {
    console.warn("Firestore is not available, proceeding without it.");
  }
  
  let storage: FirebaseStorage | null = null;
  try {
    storage = getStorage(firebaseApp);
  } catch (e) {
    console.warn("Firebase Storage is not available, proceeding without it.");
  }

  return { firebaseApp, auth, firestore, storage };
}
```

---

## File: src/firebase/config.ts

```ts
export const firebaseConfig = {
  projectId: 'studio-4511819966-bc14f',
  appId: '1:822244663005:web:2bbd7b3b2a819f1e2c0534',
  apiKey: 'AIzaSyCufQtfjRhee0FHei0PIVSPJ0eTQISlKgk',
  authDomain: 'studio-4511819966-bc14f.firebaseapp.com',
  storageBucket: 'studio-4511819966-bc14f.appspot.com',
  messagingSenderId: '822244663005',
};
```

---

## File: src/firebase/error-emitter.ts

```ts
'use client';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Defines the shape of all possible events and their corresponding payload types.
 * This centralizes event definitions for type safety across the application.
 */
export interface AppEvents {
  'permission-error': FirestorePermissionError;
}

// A generic type for a callback function.
type Callback<T> = (data: T) => void;

/**
 * A strongly-typed pub/sub event emitter.
 * It uses a generic type T that extends a record of event names to payload types.
 */
function createEventEmitter<T extends Record<string, any>>() {
  // The events object stores arrays of callbacks, keyed by event name.
  // The types ensure that a callback for a specific event matches its payload type.
  const events: { [K in keyof T]?: Array<Callback<T[K]>> } = {};

  return {
    /**
     * Subscribe to an event.
     * @param eventName The name of the event to subscribe to.
     * @param callback The function to call when the event is emitted.
     */
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName]?.push(callback);
    },

    /**
     * Unsubscribe from an event.
     * @param eventName The name of the event to unsubscribe from.
     * @param callback The specific callback to remove.
     */
    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        return;
      }
      events[eventName] = events[eventName]?.filter(cb => cb !== callback);
    },

    /**
     * Publish an event to all subscribers.
     * @param eventName The name of the event to emit.
     * @param data The data payload that corresponds to the event's type.
     */
    emit<K extends keyof T>(eventName: K, data: T[K]) {
      if (!events[eventName]) {
        return;
      }
      events[eventName]?.forEach(callback => callback(data));
    },
  };
}

// Create and export a singleton instance of the emitter, typed with our AppEvents interface.
export const errorEmitter = createEventEmitter<AppEvents>();
```

---

## File: src/firebase/errors.ts

```ts
'use client';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

// Simplified request object for the error. No auth info.
interface SecurityRuleRequest {
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a simplified, formatted error message for the LLM.
 * @param requestObject The simplified request object.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules, but omits auth details to prevent runtime crashes.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject: SecurityRuleRequest = {
      method: context.operation,
      path: `/databases/(default)/documents/${context.path}`,
      resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
    };
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
```

---

## File: src/firebase/firestore/use-collection.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Directly use memoizedTargetRefOrQuery as it's assumed to be the final query
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // This logic extracts the path from either a ref or a query
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]); // Re-run if the target query/reference changes.
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
```

---

## File: src/firebase/firestore/use-doc.tsx

```tsx
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    // Optional: setData(null); // Clear previous data instantly

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist
          setData(null);
        }
        setError(null); // Clear any previous error on successful snapshot (even if doc doesn't exist)
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]); // Re-run if the memoizedDocRef changes.

  return { data, isLoading, error };
}
```

---

## File: src/firebase/index.ts

```ts
'use client';

// This barrel file re-exports all the necessary hooks and providers.
// It does NOT contain any initialization logic itself.

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';

// Note: initializeFirebaseSDKs from client.ts is NOT exported here
// to prevent it from being accidentally imported in server components.
```

---

## File: src/firebase/non-blocking-login.tsx

```tsx
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
```

---

## File: src/firebase/non-blocking-updates.tsx

```tsx
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
```

---

## File: src/firebase/provider.tsx

```tsx
'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore | null;
  auth: Auth;
  storage: FirebaseStorage | null;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext =
  createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      // If no Auth service instance, cannot determine user state
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error('Auth service not provided.'),
      });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // Auth state determined
        setUserAuthState({
          user: firebaseUser,
          isUserLoading: false,
          userError: null,
        });
      },
      (error) => {
        // Auth listener error
        console.error('FirebaseProvider: onAuthStateChanged error:', error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
      storage,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

function useFirebaseContext() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase hooks must be used within a FirebaseProvider.');
  }
  return context;
}

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
    const { auth } = useFirebaseContext();
    if (!auth) throw new Error("Auth service is not available. Check your Firebase setup.");
    return auth;
};

/** Hook to access Firestore instance. It may be null if the service is unavailable. */
export const useFirestore = (): Firestore | null => useFirebaseContext().firestore;

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
    const { firebaseApp } = useFirebaseContext();
    if (!firebaseApp) throw new Error("Firebase App is not available. Check your Firebase setup.");
    return firebaseApp;
};

/** Hook to access Firebase Storage instance. It may be null if the service is unavailable. */
export const useStorage = (): FirebaseStorage | null => useFirebaseContext().storage;

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(
  factory: () => T,
  deps: DependencyList
): T | MemoFirebase<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}
```

---

## File: src/hooks/use-mobile.tsx

```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

---

## File: src/hooks/use-toast.ts

```ts
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

---

## File: src/lib/mock-data.ts

```ts
import type { PersonalizedEmpowermentRecommendationsInput } from "@/ai/flows/personalized-empowerment-recommendations-flow";

export const mockAiInput: PersonalizedEmpowermentRecommendationsInput = {
  beneficiaryId: "B-12345",
  currentProgress: "The beneficiary has completed the 'Introduction to Business' and 'Digital Marketing Basics' modules with high scores. They have shown strong engagement in forum discussions and submitted all assignments on time. Their quiz average is 92%.",
  skills: ["Basic business planning", "Social media marketing", "Customer communication"],
  goals: "I want to start my own online store selling handmade jewelry. My goal is to generate a sustainable monthly income of at least $500 within the first 6 months. I need to learn more about product photography, online payment systems, and how to manage inventory.",
  completedModules: [
    { id: "mod-001", name: "Introduction to Business", category: "Business Fundamentals" },
    { id: "mod-002", name: "Digital Marketing Basics", category: "Marketing" },
  ],
  availableModules: [
    { id: "mod-001", name: "Introduction to Business", description: "Learn the basics of starting a business.", category: "Business Fundamentals", link: "/dashboard/training/mod-001" },
    { id: "mod-002", name: "Digital Marketing Basics", description: "Understand the fundamentals of online marketing.", category: "Marketing", link: "/dashboard/training/mod-002" },
    { id: "mod-003", name: "Advanced Financial Management", description: "Deep dive into financial planning and analysis.", category: "Finance", link: "/dashboard/training/mod-003" },
    { id: "mod-004", name: "Product Photography for E-commerce", description: "Learn how to take stunning product photos with your smartphone.", category: "E-commerce", link: "/dashboard/training/mod-004" },
    { id: "mod-005", name: "E-commerce Platform Mastery (Shopify)", description: "A-Z guide on setting up and running a Shopify store.", category: "E-commerce", link: "/dashboard/training/mod-005" },
    { id: "mod-006", name: "Inventory Management Strategies", description: "Effective techniques for tracking and managing stock.", category: "Operations", link: "/dashboard/training/mod-006" },
  ],
  availableExternalResources: [
    { id: "res-001", name: "Canva for Social Media Graphics", description: "A free tool to create professional-looking social media posts and ads.", url: "https://www.canva.com/", category: "Marketing" },
    { id: "res-002", name: "Stripe for Online Payments", description: "A guide to setting up Stripe to accept payments online.", url: "https://stripe.com/docs", category: "E-commerce" },
    { id: "res-003", name: "HubSpot's Guide to Starting an Online Business", description: "A comprehensive blog post covering all aspects of e-commerce.", url: "https://blog.hubspot.com/sales/how-to-start-online-business", category: "Business Fundamentals" },
  ],
  availableMentorshipTopics: [
    { id: "men-001", name: "Pricing Strategy", description: "Discuss how to price your products competitively and profitably." },
    { id: "men-002", name: "Building a Brand Identity", description: "Explore how to create a memorable brand for your business." },
    { id: "men-003", name: "Navigating Legal Requirements", description: "Get advice on business registration and compliance." },
    { id: "men-004", name: "Time Management for Entrepreneurs", description: "Learn techniques to balance business and personal life." },
  ],
};
```

---

## File: src/lib/notifications.ts

```ts
import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type NotificationData = {
    userId: string;
    title: string;
    description: string;
    link: string;
};

export function sendNotification(db: Firestore, data: NotificationData) {
    const notificationPayload = {
        ...data,
        isRead: false,
        createdAt: serverTimestamp(),
    };
    addDoc(collection(db, 'notifications'), notificationPayload)
    .catch(error => {
        console.error("Error sending notification:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'notifications',
            operation: 'create',
            requestResourceData: notificationPayload,
        }));
    });
}
```

---

## File: src/lib/placeholder-images.json

```json
{
  "placeholderImages": [
    {
      "id": "login-background",
      "description": "A diverse group of people collaborating around a table with laptops, symbolizing teamwork and empowerment.",
      "imageUrl": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxtb2Rlcm4lMjBvZmZpY2V8ZW58MHx8fHwxNzE3ODU1NTg1fDA&ixlib=rb-4.0.3&q=80&w=1080",
      "imageHint": "modern office"
    },
    {
      "id": "register-background",
      "description": "A diverse group of hands coming together, symbolizing community, support, and empowerment.",
      "imageUrl": "https://images.unsplash.com/photo-1529390079861-591de354faf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxjb2xsYWJvcmF0aW9uJTIwZGl2ZXJzaXR5fGVufDB8fHx8MTcxNzU5ODQ0N3ww&ixlib=rb-4.0.3&q=80&w=1080",
      "imageHint": "collaboration diversity"
    },
    {
      "id": "landing-hero",
      "description": "Two women from a local community engaged in sewing and crafts, symbolizing empowerment and skill-building.",
      "imageUrl": "https://images.unsplash.com/photo-1595223949987-1b4274ed44a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzE3MDB8MHwxfHNlYXJjaHwxfHx3b21lbiUyMHNld2luZ3xlbnwwfHx8fDE3MTgyMDY5MDd8MA&ixlib=rb-4.0.3&q=80&w=1080",
      "imageHint": "women sewing"
    }
  ]
}
```

---

## File: src/lib/placeholder-images.ts

```ts
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
```

---

## File: src/lib/products-data.ts

```ts

export type Product = {
    id: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    location: string;
    imageUrl?: string;
    beneficiaryId: string;
    beneficiaryName: string;
    category?: string;
    deliveryCost?: number;
}
```

---

## File: src/lib/utils.ts

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
```

---

## File: tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Cairo', 'sans-serif'],
        headline: ['Cairo', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "src/ai/dev.ts"]
}
```