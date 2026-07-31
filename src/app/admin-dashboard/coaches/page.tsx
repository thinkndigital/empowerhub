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

interface Coach { id: string; displayName?: string; name?: string; bio?: string; description?: string; specializations?: string[]; avatarUrl?: string; sessionPrice?: number | null; email?: string; }

export default function AdminCoachesPage() {
  const { symbol } = useCurrency();
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
          <h1 className="text-2xl font-bold tracking-tight">المدربون</h1>
          <p className="text-sm text-muted-foreground mt-1">جميع المدربين المسجلين على المنصة</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{coaches.length} مدرب</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المدرب</TableHead>
              <TableHead className="text-right">التخصصات</TableHead>
              <TableHead className="text-right">سعر الجلسة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
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
              <TableRow><TableCell colSpan={4} className="text-center py-16 text-muted-foreground"><GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا يوجد مدربون بعد.</p></TableCell></TableRow>
            ) : coaches.map(c => {
              const name = c.displayName || c.name || 'بدون اسم';
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
                    {c.sessionPrice ? `${c.sessionPrice} ${symbol}` : <span className="text-muted-foreground text-xs">غير محدد</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/coaches/${c.id}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />الملف الشخصي
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
