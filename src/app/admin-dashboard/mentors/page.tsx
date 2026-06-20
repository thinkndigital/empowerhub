
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

  const { data: mentors, isLoading: loading } = useCollection<UserProfile>(mentorsQuery);

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المرشدون</h1>
        <p className="text-sm text-muted-foreground">إدارة المرشدين في المنصة وتتبع أدائهم.</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="ml-2 h-4 w-4" />
        تصدير
      </Button>
    </div>
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">قائمة المرشدين</CardTitle>
            <CardDescription>
              {!loading && mentors ? `${mentors.length} مرشد مسجل` : 'جاري التحميل...'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
                    <DropdownMenuContent align="end">
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
        </div>
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
