
"use client";

import { MoreHorizontal, Download, UserX, Edit, User, Eye } from "lucide-react";
import { ExportButton } from "@/components/export-button";
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
    organization: "مدير جهة",
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

  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const organizationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "organizations"));
  }, [firestore]);
  const { data: organizations, isLoading: orgsLoading } = useCollection<Organization>(organizationsQuery);

  const orgMap = useMemo(() => {
      if (!organizations) return new Map();
      return new Map(organizations.map(o => [o.id, o.name]));
  }, [organizations]);

  const loading = usersLoading || orgsLoading;


  const roleAr: Record<string, string> = { admin: 'مدير', organization: 'منظمة', mentor: 'مرشد', coach: 'مدرب', beneficiary: 'مستفيد' };

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المستخدمون</h1>
        <p className="text-sm text-muted-foreground">عرض وإدارة جميع المستخدمين المسجلين على المنصة.</p>
      </div>
      <ExportButton
        title="قائمة المستخدمين"
        filename={`users-${new Date().toISOString().slice(0,10)}`}
        headers={['الاسم', 'البريد الإلكتروني', 'الدور', 'المنظمة', 'الحالة']}
        rows={(users ?? []).map(u => [
          u.name || '',
          u.email || '',
          roleAr[u.role || ''] || u.role || '',
          orgMap.get(u.organizationId || '') || '',
          u.status || 'نشط',
        ])}
        options={{ summary: { 'إجمالي المستخدمين': String((users ?? []).length) } }}
      />
    </div>
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>قائمة المستخدمين</CardTitle>
            <CardDescription>
              {!loading && users ? `${users.length} مستخدم مسجل` : 'جاري التحميل...'}
            </CardDescription>
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
                    <DropdownMenuContent align="end">
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
