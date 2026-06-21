import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [snap1, snap2] = await Promise.all([
      adminDb.collection('courses').where('status', '==', 'published').limit(12).get(),
      adminDb.collection('courses').where('status', '==', 'منشورة').limit(12).get(),
    ]);

    const seen = new Set<string>();
    const courses = [...snap1.docs, ...snap2.docs]
      .filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; })
      .map(d => {
        const cd = d.data();
        return {
          id: d.id,
          title: cd.title || '',
          description: cd.description || '',
          price: cd.price ?? null,
          coverImageUrl: cd.coverImageUrl || cd.imageUrl || '',
          duration: cd.duration || '',
          createdBy: cd.createdBy || '',
          coachName: cd.coachName || '',
          enrollmentCount: cd.enrollmentCount || 0,
        };
      });

    // Enrich with coach names from users collection
    const coachIds = Array.from(new Set(courses.map(c => c.createdBy).filter(Boolean)));
    if (coachIds.length > 0) {
      const coachDocs = await Promise.all(coachIds.map(id => adminDb.collection('users').doc(id).get()));
      const coachMap: Record<string, string> = {};
      coachDocs.forEach(d => {
        if (d.exists) coachMap[d.id] = d.data()!.name || d.data()!.displayName || '';
      });
      courses.forEach(c => {
        if (c.createdBy && coachMap[c.createdBy]) c.coachName = coachMap[c.createdBy];
      });
    }

    return NextResponse.json({ courses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
