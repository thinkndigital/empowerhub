"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, MapPin } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface Project { id: string; title: string; description: string; organizationName: string; type: string; location: string; deadline: string; publishedAt: string | null; }

function formatDate(d: string | null, locale: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminProjectsPage() {
  const { lang } = useLanguage();
  const bi = (ar: string, en: string) => (lang === 'en' ? en : ar);
  const locale = lang === 'en' ? 'en-US' : 'ar-SA';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/projects').then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bi("المشاريع والفرص", "Projects & Opportunities")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bi("جميع الفرص والمشاريع المنشورة", "All published opportunities and projects")}</p>
        </div>
        {!loading && <Badge variant="secondary" className="text-sm">{projects.length} {bi("مشروع", "projects")}</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{bi("المشروع", "Project")}</TableHead>
              <TableHead className="text-right">{bi("المنظمة", "Organization")}</TableHead>
              <TableHead className="text-right">{bi("النوع", "Type")}</TableHead>
              <TableHead className="text-right">{bi("الموقع", "Location")}</TableHead>
              <TableHead className="text-right">{bi("الموعد النهائي", "Deadline")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
              ))
            ) : projects.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground"><Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{bi("لا توجد مشاريع بعد.", "No projects yet.")}</p></TableCell></TableRow>
            ) : projects.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium text-sm">{p.title}</p>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>}
                </TableCell>
                <TableCell className="text-sm">{p.organizationName || '—'}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{p.type || '—'}</Badge></TableCell>
                <TableCell>
                  {p.location ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{p.location}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(p.deadline, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
