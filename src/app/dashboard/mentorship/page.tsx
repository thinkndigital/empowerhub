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
import { collection, query, where, doc, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
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


  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({ variant: "destructive", title: "خطأ", description: "لا يمكن إرسال رسالة فارغة." });
      return;
    }
    if (!firestore || !authUser || !mentor) return;
    try {
      // Find or create conversation between beneficiary and mentor
      const convoQuery = query(
        collection(firestore, "conversations"),
        where("participants", "array-contains", authUser.uid)
      );
      const snap = await getDocs(convoQuery);
      let convoId: string | null = null;
      snap.forEach(d => {
        const p: string[] = d.data().participants || [];
        if (p.includes(mentor.id)) convoId = d.id;
      });
      if (!convoId) {
        const convoRef = await addDoc(collection(firestore, "conversations"), {
          participants: [authUser.uid, mentor.id],
          createdAt: serverTimestamp(),
          lastMessage: message.trim(),
          lastMessageAt: serverTimestamp(),
        });
        convoId = convoRef.id;
      }
      await addDoc(collection(firestore, "conversations", convoId, "messages"), {
        senderId: authUser.uid,
        text: message.trim(),
        createdAt: serverTimestamp(),
      });
      // Notify mentor
      await addDoc(collection(firestore, "notifications"), {
        userId: mentor.id,
        title: "رسالة جديدة من مستفيد",
        body: message.trim().slice(0, 80),
        read: false,
        createdAt: serverTimestamp(),
        link: "/mentor-dashboard/messages",
      });
      toast({ title: "تم الإرسال!", description: "تم إرسال رسالتك إلى مرشدك بنجاح." });
      setMessage("");
    } catch {
      toast({ variant: "destructive", title: "خطأ!", description: "فشل إرسال الرسالة. حاول مرة أخرى." });
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإرشاد والتوجيه</h1>
        <p className="text-muted-foreground mt-1">تابع جلساتك الإرشادية وتواصل مع مرشدك.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4 text-primary" />
                الجلسات القادمة
              </CardTitle>
              <CardDescription>استعد لجلسات الإرشاد القادمة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <Skeleton className="h-20 w-full" />}
              {!loading && upcomingSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد جلسات قادمة</p>
                </div>
              )}
              {!loading && upcomingSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div>
                    <p className="font-semibold">{session.title}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(parseISO(session.date), "p", { locale: ar })}</span>
                    </div>
                  </div>
                  <Button size="sm" className="shadow-sm" asChild>
                    <a href={session.meetLink || "https://meet.google.com"} target="_blank" rel="noopener noreferrer">
                      <Video className="ml-2 h-3.5 w-3.5" />
                      انضم
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4 text-primary" />
                الجلسات السابقة
              </CardTitle>
              <CardDescription>مراجعة ملاحظات الجلسات السابقة وتقييمها.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <Skeleton className="h-24 w-full" />}
              {!loading && pastSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد جلسات سابقة</p>
                </div>
              )}
              {!loading && pastSessions.map(session => (
                <div key={session.id} className="flex items-start justify-between p-4 rounded-xl bg-muted/40 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{session.title}</p>
                      <span className="text-xs text-muted-foreground">{format(parseISO(session.date), "d MMMM yyyy", { locale: ar })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{session.notes || "لا توجد ملاحظات."}</p>
                  </div>
                  {session.status === 'completed' && (
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleEvaluationClick(session)}>
                      <Star className="ml-1.5 h-3.5 w-3.5" />
                      تقييم
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {loading ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="items-center text-center">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="pt-2 w-full space-y-2">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              </CardHeader>
            </Card>
          ) : mentor ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="items-center text-center pb-2">
                <Avatar className="w-20 h-20 border-4 border-primary/20 shadow-md">
                  <AvatarImage src={mentor.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">{mentor.name?.charAt(0) || 'م'}</AvatarFallback>
                </Avatar>
                <div className="pt-2">
                  <CardTitle className="text-base">{mentor.name || 'مرشد'}</CardTitle>
                  <CardDescription className="text-xs mt-1">{mentor.expertise || "خبير في مجاله"}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground text-center leading-relaxed italic">
                  "مهمتي مساعدتك على تحقيق أهدافك وتحويل فكرتك إلى مشروع ناجح."
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="items-center text-center py-8">
                <div className="p-4 bg-muted rounded-full mb-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">لم يتم تعيين مرشد</CardTitle>
                <CardDescription className="text-sm">تواصل مع مدير منظمتك لتعيين مرشد لك.</CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">أرسل رسالة لمرشدك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="اكتب رسالتك هنا..."
                className="min-h-[110px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!mentor}
              />
              <Button className="w-full shadow-sm" onClick={handleSendMessage} disabled={!mentor}>إرسال الرسالة</Button>
            </CardContent>
          </Card>
        </div>
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
