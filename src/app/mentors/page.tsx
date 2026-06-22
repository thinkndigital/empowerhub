"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Calendar, Users } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

interface Mentor {
  id: string;
  name: string;
  displayName?: string;
  bio?: string;
  description?: string;
  specializations?: string[];
  avatarUrl: string;
  sessionPrice: number | null;
  whatsapp: string;
  linkedin: string;
  yearsOfExperience?: number | null;
}

export default function MentorsListPage() {
  const { symbol } = useCurrency();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/public/mentors')
      .then(r => r.json())
      .then(d => setMentors(d.mentors || []))
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mentors.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = m.displayName || m.name || '';
    const bio = m.bio || m.description || '';
    const specs = (m.specializations || []).join(' ');
    return name.toLowerCase().includes(q) || bio.toLowerCase().includes(q) || specs.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <span className="text-border/80 select-none">/</span>
            <span className="text-foreground font-medium">المرشدون</span>
          </nav>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">إرشاد شخصي</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">المرشدون</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed mb-6">
            تواصل مع مرشدين متخصصين يساعدونك على تحقيق أهدافك وتطوير مسارك المهني.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث عن مرشد..."
              className="pr-10 h-11 bg-card"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold mb-1">
              {search ? `لا نتائج لـ "${search}"` : 'لا يوجد مرشدون حالياً'}
            </p>
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch('')} className="mt-4">مسح البحث</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(m => {
              const name = m.displayName || m.name || 'بدون اسم';
              const bio = m.bio || m.description || '';
              const specs = m.specializations || [];
              const hasPrice = m.sessionPrice != null && m.sessionPrice > 0;
              return (
                <div key={m.id} className="group rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all flex flex-col p-5 gap-3">
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xl text-primary flex-shrink-0 overflow-hidden border-2 border-primary/20">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{name}</h3>
                      {m.yearsOfExperience && (
                        <p className="text-xs text-muted-foreground">{m.yearsOfExperience} سنوات خبرة</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{bio}</p>
                  )}

                  {/* Specializations */}
                  {specs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {specs.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0.5">{s}</Badge>
                      ))}
                      {specs.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1">+{specs.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                    <span className="font-bold text-sm text-foreground">
                      {hasPrice ? `${m.sessionPrice} ${symbol} / جلسة` : 'تواصل للسعر'}
                    </span>
                    <div className="flex gap-1.5">
                      {m.whatsapp && (
                        <a href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg border border-green-500/40 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button size="sm" className="h-8 text-xs px-3 gap-1" asChild>
                        <Link href={`/mentors/${m.id}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          الملف
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
