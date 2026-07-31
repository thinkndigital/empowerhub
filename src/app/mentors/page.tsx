"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

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
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
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

      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 animate-pulse flex flex-col items-center gap-4">
                <div className="h-32 w-32 rounded-full bg-muted" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-9 bg-muted rounded w-full mt-auto" />
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map(m => {
              const name = m.displayName || m.name || 'بدون اسم';
              const bio = m.bio || m.description || '';
              const specs = m.specializations || [];
              const subtitle = specs.length > 0 ? specs[0] : bio;
              return (
                <div key={m.id} className="group rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all flex flex-col items-center p-6 gap-3 text-center">
                  {/* Avatar — large centered circle */}
                  <div className="relative h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center font-bold text-4xl text-primary overflow-hidden border-4 border-primary/20 shadow-md shrink-0">
                    <span>{name[0]}</span>
                    {m.avatarUrl && (
                      <img
                        src={m.avatarUrl}
                        alt={name}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{name}</h3>
                    {m.yearsOfExperience && (
                      <p className="text-xs text-muted-foreground mt-0.5">{m.yearsOfExperience} سنوات خبرة</p>
                    )}
                  </div>

                  {/* Subtitle */}
                  {subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{subtitle}</p>
                  )}

                  <div className="flex-1" />

                  {/* CTA */}
                  <Button size="sm" className="w-full mt-2" asChild>
                    <Link href={`/mentors/${m.id}`}>الملف الشخصي</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
