
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, Download, Edit, Trash2, Eye, Plus } from "lucide-react";
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
    DialogTrigger,
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

const createOrgSchema = z.object({
  orgName: z.string().min(2, { message: "يجب أن يكون اسم المنظمة حرفين على الأقل." }),
  adminName: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  adminEmail: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
});

export default function OrganizationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);
  const [orgToView, setOrgToView] = useState<Organization | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const organizationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "organizations"));
  }, [firestore]);

  const { data: organizations, isLoading: loading } = useCollection<Organization>(organizationsQuery);

  const form = useForm<z.infer<typeof orgFormSchema>>({
    resolver: zodResolver(orgFormSchema),
  });

  const createForm = useForm<z.infer<typeof createOrgSchema>>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { orgName: "", adminName: "", adminEmail: "" },
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

  async function handleCreateOrg(values: z.infer<typeof createOrgSchema>) {
    setIsCreating(true);
    try {
      const res = await fetch('/api/create-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تم الإنشاء بنجاح!", description: data.message });
      setIsCreateOpen(false);
      createForm.reset();
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ!", description: err.message });
    } finally {
      setIsCreating(false);
    }
  }

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إنشاء منظمة جديدة
            </Button>
          </div>
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
                    <DropdownMenuContent align="end">
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


    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إنشاء منظمة جديدة</DialogTitle>
          <DialogDescription>أدخل بيانات المنظمة وحساب المدير المسؤول.</DialogDescription>
        </DialogHeader>
        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(handleCreateOrg)} className="space-y-4 pt-2">
            <FormField control={createForm.control} name="orgName" render={({ field }) => (
              <FormItem><FormLabel>اسم المنظمة</FormLabel><FormControl><Input placeholder="مثال: مؤسسة الأمل" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={createForm.control} name="adminName" render={({ field }) => (
              <FormItem><FormLabel>اسم مدير المنظمة</FormLabel><FormControl><Input placeholder="الاسم الكامل" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={createForm.control} name="adminEmail" render={({ field }) => (
              <FormItem><FormLabel>البريد الإلكتروني للمدير</FormLabel><FormControl><Input dir="ltr" placeholder="admin@org.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <p className="text-xs text-muted-foreground">كلمة المرور المؤقتة: <span className="font-mono font-medium">EmpowerHub@2024</span></p>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
              <Button type="submit" disabled={isCreating}>{isCreating ? "جاري الإنشاء..." : "إنشاء المنظمة"}</Button>
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
