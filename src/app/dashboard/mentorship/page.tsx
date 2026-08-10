"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, User, Star } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, parseISO } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { EvaluationDialog } from "@/components/evaluation-dialog";
import { useLanguage } from "@/components/language-provider";

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
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? enUS : arLocale;
  const [message, setMessage] = useState("");
  const { user: authUser, userProfile, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [evaluationTarget, setEvaluationTarget] = useState<EvaluationTarget | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const headers = { authorization: `Bearer ${token}` };

      const [sRes, mRes] = await Promise.all([
        fetch('/api/beneficiary/sessions', { headers }),
        fetch('/api/beneficiary/mentor', { headers }),
      ]);
      const [sJson, mJson] = await Promise.all([sRes.json(), mRes.json()]);
      setSessions(sJson.sessions || []);
      setMentor(mJson.mentor || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && authUser) fetchData();
  }, [authLoading, authUser, fetchData]);

  const { upcomingSessions, pastSessions } = useMemo(() => {
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
      pastSessions: past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [sessions]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({ variant: "destructive", title: bi("خطأ", "Error"), description: bi("لا يمكن إرسال رسالة فارغة.", "Cannot send an empty message.") });
      return;
    }
    if (!firestore || !authUser || !mentor) return;
    try {
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
      await addDoc(collection(firestore, "notifications"), {
        userId: mentor.id,
        title: "رسالة جديدة من مستفيد",
        body: message.trim().slice(0, 80),
        read: false,
        createdAt: serverTimestamp(),
        link: "/mentor-dashboard/messages",
      });
      toast({ title: bi("تم الإرسال!", "Sent!"), description: bi("تم إرسال رسالتك إلى مرشدك بنجاح.", "Your message was sent to your mentor successfully.") });
      setMessage("");
    } catch {
      toast({ variant: "destructive", title: bi("خطأ!", "Error!"), description: bi("فشل إرسال الرسالة. حاول مرة أخرى.", "Failed to send the message. Please try again.") });
    }
  };

  const handleEvaluationClick = (session: Session) => {
    if (!mentor) return;
    setEvaluationTarget({
      sessionId: session.id,
      evaluatedId: mentor.id,
      evaluatedName: mentor.name || bi('المرشد', 'Mentor'),
    });
  };

  return (
    <>
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bi("الإرشاد والتوجيه", "Mentoring & guidance")}</h1>
        <p className="text-muted-foreground mt-1">{bi("تابع جلساتك الإرشادية وتواصل مع مرشدك.", "Track your mentoring sessions and connect with your mentor.")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4 text-primary" />
                {bi("الجلسات القادمة", "Upcoming sessions")}
              </CardTitle>
              <CardDescription>{bi("استعد لجلسات الإرشاد القادمة.", "Get ready for your upcoming mentoring sessions.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <Skeleton className="h-20 w-full" />}
              {!loading && upcomingSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{bi("لا توجد جلسات قادمة", "No upcoming sessions")}</p>
                </div>
              )}
              {!loading && upcomingSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div>
                    <p className="font-semibold">{session.title}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(parseISO(session.date), "d MMMM yyyy", { locale })}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(parseISO(session.date), "p", { locale })}</span>
                    </div>
                  </div>
                  <Button size="sm" className="shadow-sm" asChild>
                    <a href={session.meetLink || "https://meet.google.com"} target="_blank" rel="noopener noreferrer">
                      <Video className="ml-2 h-3.5 w-3.5" />
                      {bi("انضم", "Join")}
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
                {bi("الجلسات السابقة", "Past sessions")}
              </CardTitle>
              <CardDescription>{bi("مراجعة ملاحظات الجلسات السابقة وتقييمها.", "Review notes from past sessions and rate them.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <Skeleton className="h-24 w-full" />}
              {!loading && pastSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{bi("لا توجد جلسات سابقة", "No past sessions")}</p>
                </div>
              )}
              {!loading && pastSessions.map(session => (
                <div key={session.id} className="flex items-start justify-between p-4 rounded-xl bg-muted/40 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{session.title}</p>
                      <span className="text-xs text-muted-foreground">{format(parseISO(session.date), "d MMMM yyyy", { locale })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{session.notes || bi("لا توجد ملاحظات.", "No notes.")}</p>
                  </div>
                  {session.status === 'completed' && (
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleEvaluationClick(session)}>
                      <Star className="ml-1.5 h-3.5 w-3.5" />
                      {bi("تقييم", "Rate")}
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
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">{mentor.name?.charAt(0) || bi('م', 'M')}</AvatarFallback>
                </Avatar>
                <div className="pt-2">
                  <CardTitle className="text-base">{mentor.name || bi('مرشد', 'Mentor')}</CardTitle>
                  <CardDescription className="text-xs mt-1">{mentor.expertise || bi("خبير في مجاله", "Expert in their field")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground text-center leading-relaxed italic">
                  {bi("\"مهمتي مساعدتك على تحقيق أهدافك وتحويل فكرتك إلى مشروع ناجح.\"", "\"My mission is to help you achieve your goals and turn your idea into a successful project.\"")}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="items-center text-center py-8">
                <div className="p-4 bg-muted rounded-full mb-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{bi("لم يتم تعيين مرشد", "No mentor assigned")}</CardTitle>
                <CardDescription className="text-sm">{bi("تواصل مع مدير منظمتك لتعيين مرشد لك.", "Contact your organization admin to have a mentor assigned to you.")}</CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{bi("أرسل رسالة لمرشدك", "Send a message to your mentor")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={bi("اكتب رسالتك هنا...", "Type your message here...")}
                className="min-h-[110px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!mentor}
              />
              <Button className="w-full shadow-sm" onClick={handleSendMessage} disabled={!mentor}>{bi("إرسال الرسالة", "Send message")}</Button>
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
