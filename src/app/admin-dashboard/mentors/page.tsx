"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";

interface Mentor { id: string; displayName?: string; name?: string; bio?: string; specializations?: string[]; avatarUrl?: string; sessionPrice?: number | null; email?: string; }

export default function AdminMentorsPage() {
  const { symbol } = useCurrency();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/mentors').then(r => r.json()).then(d => {
      setMentors(d.mentors || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المرشدون</h1>
          <p className="text-sm text-muted-foreground mt-1">جميع المرشدين المسجلين على المنصة</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{mentors.length} مرشد</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المرشد</TableHead>
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
            ) : mentors.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-16 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا يوجد مرشدون بعد.</p></TableCell></TableRow>
            ) : mentors.map(m => {
              const name = m.displayName || m.name || 'بدون اسم';
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.avatarUrl} alt={name} />
                        <AvatarFallback className="text-xs">{name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(m.specializations || []).slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {m.sessionPrice ? `${m.sessionPrice} ${symbol}` : <span className="text-muted-foreground text-xs">غير محدد</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/mentors/${m.id}`} target="_blank">
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
