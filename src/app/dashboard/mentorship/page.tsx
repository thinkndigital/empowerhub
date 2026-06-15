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

  const { data: mentor, isLoading: mentorLoading } = useDoc<UserProfile>(mentorRef);

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "sessions"), where("attendees", "array-contains", authUser.uid));
  }, [firestore, authUser]);

  const { data: sessions, isLoading: sessionsLoading } = useCollection<Session>(sessionsQuery);
  
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
