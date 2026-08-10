"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface Coach {
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

export default function CoachesListPage() {
  const { lang, dir } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/public/mentors')
      .then(r => r.json())
      .then(d => setCoaches(d.coaches || []))
      .catch(() => setCoaches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = coaches.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = c.displayName || c.name || '';
    const bio = c.bio || c.description || '';
    const specs = (c.specializations || []).join(' ');
    return name.toLowerCase().includes(q) || bio.toLowerCase().includes(q) || specs.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">{bi('الرئيسية', 'Home')}</Link>
            <span className="text-border/80 select-none">/</span>
            <span className="text-foreground font-medium">{bi('المدربون', 'Coaches')}</span>
          </nav>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">{bi('تدريب احترافي', 'Professional coaching')}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">{bi('المدربون', 'Coaches')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed mb-6">
            {bi('اكتشف مدربين متخصصين يساعدونك على بناء مهاراتك وتطوير مسيرتك المهنية.', 'Discover specialized coaches who help you build your skills and develop your career.')}
          </p>
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={bi('ابحث عن مدرب...', 'Search for a coach...')}
              className="pr-10 h-11 bg-card"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container py-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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
              {search ? bi(`لا نتائج لـ "${search}"`, `No results for "${search}"`) : bi('لا يوجد مدربون حالياً', 'No coaches available yet')}
            </p>
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch('')} className="mt-4">{bi('مسح البحث', 'Clear search')}</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(c => {
              const name = c.displayName || c.name || bi('بدون اسم', 'No name');
              const bio = c.bio || c.description || '';
              const specs = c.specializations || [];
              const subtitle = specs.length > 0 ? specs[0] : bio;
              return (
                <div key={c.id} className="group rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all flex flex-col items-center p-6 gap-3 text-center">
                  {/* Avatar — large centered circle */}
                  <div className="relative h-32 w-32 rounded-full bg-orange-500/10 flex items-center justify-center font-bold text-4xl text-orange-600 overflow-hidden border-4 border-orange-500/20 shadow-md shrink-0">
                    <span>{name[0]}</span>
                    {c.avatarUrl && (
                      <img
                        src={c.avatarUrl}
                        alt={name}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{name}</h3>
                    {c.yearsOfExperience && (
                      <p className="text-xs text-muted-foreground mt-0.5">{bi(`${c.yearsOfExperience} سنوات خبرة`, `${c.yearsOfExperience} years of experience`)}</p>
                    )}
                  </div>

                  {/* Subtitle */}
                  {subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{subtitle}</p>
                  )}

                  <div className="flex-1" />

                  {/* CTA */}
                  <Button size="sm" className="w-full mt-2" asChild>
                    <Link href={`/coaches/${c.id}`}>{bi('الملف الشخصي', 'View profile')}</Link>
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
