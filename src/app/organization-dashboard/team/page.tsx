
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

    const { data: team, isLoading: loading } = useCollection<UserProfile>(teamQuery);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!ORG_ID) return;
        try {
            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    role: values.role || 'team_member',
                    organizationId: ORG_ID,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast({ title: "تم بنجاح!", description: `تمت إضافة "${values.name}". كلمة المرور: EmpowerHub@2024` });
            form.reset();
            setIsAddDialogOpen(false);
        } catch (err: any) {
            toast({ variant: "destructive", title: "خطأ!", description: err.message });
        }
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
                    <DropdownMenuContent align="end">
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
