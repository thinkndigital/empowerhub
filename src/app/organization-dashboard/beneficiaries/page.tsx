
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


// ORG_ID is now dynamic — read from userProfile inside the component

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
    const { userProfile } = useUser();
    const ORG_ID = userProfile?.organizationId || '';
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("الكل");
    const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<Beneficiary | null>(null);
    const [beneficiaryToView, setBeneficiaryToView] = useState<Beneficiary | null>(null);
    const [assignment, setAssignment] = useState<{beneficiary: Beneficiary, role: 'mentor' | 'coach'} | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const firestore = useFirestore();

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !ORG_ID) return null;
        return query(collection(firestore, "users"), where("role", "==", "beneficiary"), where("organizationId", "==", ORG_ID));
    }, [firestore, ORG_ID]);
    const { data: rawBeneficiaries, isLoading: beneficiariesLoading } = useCollection<RawBeneficiary>(beneficiariesQuery);

    const mentorsQuery = useMemoFirebase(() => {
        if (!firestore || !ORG_ID) return null;
        return query(collection(firestore, "users"), where("role", "==", "mentor"), where("organizationId", "==", ORG_ID));
    }, [firestore, ORG_ID]);
    const { data: mentors, isLoading: mentorsLoading } = useCollection<UserProfile>(mentorsQuery);

    const coachesQuery = useMemoFirebase(() => {
        if (!firestore || !ORG_ID) return null;
        return query(collection(firestore, "users"), where("role", "==", "coach"), where("organizationId", "==", ORG_ID));
    }, [firestore, ORG_ID]);
    const { data: coaches, isLoading: coachesLoading } = useCollection<UserProfile>(coachesQuery);

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

    async function onAddSubmit(values: z.infer<typeof formSchema>) {
        setIsCreating(true);
        try {
            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    role: 'beneficiary',
                    organizationId: ORG_ID,
                    category: values.category,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast({
                title: "تم بنجاح!",
                description: `تمت إضافة "${values.name}". كلمة المرور المؤقتة: EmpowerHub@2024`,
            });
            form.reset();
            setIsAddDialogOpen(false);
        } catch (err: any) {
            toast({ variant: "destructive", title: "فشل الإنشاء", description: err.message });
        } finally {
            setIsCreating(false);
        }
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
                                    <Button type="submit" disabled={isCreating}>{isCreating ? "جاري الإضافة..." : "إرسال دعوة"}</Button>
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
                            <DropdownMenuContent align="end">
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
