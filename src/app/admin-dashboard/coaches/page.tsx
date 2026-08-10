"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/components/language-provider";

interface Coach { id: string; displayName?: string; name?: string; bio?: string; description?: string; specializations?: string[]; avatarUrl?: string; sessionPrice?: number | null; email?: string; }

export default function AdminCoachesPage() {
  const { symbol } = useCurrency();
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/mentors').then(r => r.json()).then(d => {
      setCoaches(d.coaches || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("المدربون", "Coaches")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bi("جميع المدربين المسجلين على المنصة", "All coaches registered on the platform")}</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{coaches.length} {bi("مدرب", "coaches")}</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{bi("المدرب", "Coach")}</TableHead>
              <TableHead className="text-right">{bi("التخصصات", "Specializations")}</TableHead>
              <TableHead className="text-right">{bi("سعر الجلسة", "Session price")}</TableHead>
              <TableHead className="text-right">{bi("الإجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : coaches.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-16 text-muted-foreground"><GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{bi("لا يوجد مدربون بعد.", "No coaches yet.")}</p></TableCell></TableRow>
            ) : coaches.map(c => {
              const name = c.displayName || c.name || bi('بدون اسم', 'No name');
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.avatarUrl} alt={name} />
                        <AvatarFallback className="text-xs">{name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(c.specializations || []).slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {c.sessionPrice ? `${c.sessionPrice} ${symbol}` : <span className="text-muted-foreground text-xs">{bi("غير محدد", "Not set")}</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/coaches/${c.id}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />{bi("الملف الشخصي", "Profile")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
