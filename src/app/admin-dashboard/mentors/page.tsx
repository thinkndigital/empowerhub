
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
import { useLanguage } from "@/components/language-provider";

export default function MentorsPage() {
  const { toast } = useToast();
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const firestore = useFirestore();
  const [mentorToView, setMentorToView] = useState<UserProfile | null>(null);

  const mentorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "mentor"));
  }, [firestore]);

  const { data: mentors, isLoading: loading } = useCollection<UserProfile>(mentorsQuery);

  const handleExport = () => {
    toast({
      title: bi("جاري تصدير قائمة المرشدين...", "Exporting mentors list..."),
      description: bi("سيتم تنزيل ملف CSV قريبًا.", "The CSV file will download shortly."),
    });
  };

  const handleToggleStatus = async (mentor: UserProfile) => {
    if (!firestore) return;
    const mentorRef = doc(firestore, "users", mentor.id);
    const newStatus = mentor.status === "نشط" ? "غير نشط" : "نشط";

    updateDoc(mentorRef, { status: newStatus })
        .then(() => {
            toast({
                title: bi(`تم تغيير حالة المرشد`, `Mentor status changed`),
                description: bi(`أصبحت حالة ${mentor.name || 'المرشد'} الآن "${newStatus}".`, `${mentor.name || 'The mentor'}'s status is now "${newStatus}".`),
            });
        })
        .catch((err) => {
            toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشلت عملية التحديث.", "The update failed.")});
            const permissionError = new FirestorePermissionError({ path: mentorRef.path, operation: 'update', requestResourceData: { status: newStatus } });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  return (
    <div className="space-y-6" dir={dir}>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("المرشدون", "Mentors")}</h1>
        <p className="text-sm text-muted-foreground">{bi("إدارة المرشدين في المنصة وتتبع أدائهم.", "Manage mentors on the platform and track their performance.")}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="ml-2 h-4 w-4" />
        {bi("تصدير", "Export")}
      </Button>
    </div>
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">{bi("قائمة المرشدين", "Mentors list")}</CardTitle>
            <CardDescription>
              {!loading && mentors ? `${mentors.length} ${bi("مرشد مسجل", "registered mentors")}` : bi('جاري التحميل...', 'Loading...')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{bi("الاسم", "Name")}</TableHead>
              <TableHead className="hidden md:table-cell">{bi("البريد الإلكتروني", "Email")}</TableHead>
              <TableHead>{bi("مجال الخبرة", "Expertise")}</TableHead>
              <TableHead className="text-center">{bi("الحالة", "Status")}</TableHead>
              <TableHead>
                <span className="sr-only">{bi("الإجراءات", "Actions")}</span>
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
              const mentorName = mentor.name || bi('مرشد بلا اسم', 'Unnamed mentor');
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
                <TableCell className="hidden md:table-cell">{mentor.email || bi('لا يوجد بريد', 'No email')}</TableCell>
                <TableCell>{mentor.expertise || bi("غير محدد", "Not specified")}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={mentor.status === "نشط" ? "default" : "secondary"}>
                    {mentor.status || bi('غير محدد', 'Not specified')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{bi("قائمة", "Menu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{bi("الإجراءات", "Actions")}</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setMentorToView(mentor)}>
                        <Eye className="ml-2 h-4 w-4" />
                        {bi("عرض الملف الشخصي", "View profile")}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin-dashboard/messages">
                            <MessageSquare className="ml-2 h-4 w-4" />
                            {bi("إرسال رسالة", "Send message")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(mentor)}
                        className={mentor.status === "نشط" ? "text-red-500" : ""}
                      >
                        <UserX className="ml-2 h-4 w-4" />
                        {mentor.status === "نشط" ? bi("إيقاف الحساب", "Deactivate account") : bi("تفعيل الحساب", "Activate account")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
            {!loading && (!mentors || mentors.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">{bi("لا يوجد مرشدون لعرضهم.", "No mentors to display.")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>

    <Dialog open={!!mentorToView} onOpenChange={(isOpen) => !isOpen && setMentorToView(null)}>
        <DialogContent dir={dir}>
            <DialogHeader>
                <DialogTitle>{bi("الملف الشخصي للمرشد", "Mentor profile")}</DialogTitle>
                <DialogDescription>{bi("تفاصيل المرشد", "Mentor details for")} {mentorToView?.name || bi('بلا اسم', 'Unnamed')}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={mentorToView?.avatarUrl || `https://picsum.photos/seed/${mentorToView?.id}/100/100`} alt={mentorToView?.name || bi('مرشد', 'Mentor')} />
                    <AvatarFallback>{mentorToView?.name?.charAt(0) || 'M'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{mentorToView?.name || bi('مرشد بلا اسم', 'Unnamed mentor')}</h3>
                    <p className="text-muted-foreground">{mentorToView?.email || bi('لا يوجد بريد إلكتروني', 'No email')}</p>
                </div>
                <div className="text-right space-y-2 border-t pt-4">
                    <p><strong>{bi("مجال الخبرة:", "Expertise:")}</strong> {mentorToView?.expertise || bi('غير محدد', 'Not specified')}</p>
                    <p><strong>{bi("الحالة:", "Status:")}</strong> <Badge variant={mentorToView?.status === "نشط" ? "default" : "secondary"}>{mentorToView?.status || bi('غير محدد', 'Not specified')}</Badge></p>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    </div>
  );
}
