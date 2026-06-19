import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

function normalizeDate(d: any): string | undefined {
  if (!d) return undefined;
  if (typeof d === 'string') return d;
  const s = d._seconds ?? d.seconds;
  if (s) return new Date(s * 1000).toISOString();
  return undefined;
}

export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [orgsSnap, subsSnap] = await Promise.all([
    adminDb.collection('organizations').get(),
    adminDb.collection('subscriptions').get(),
  ]);

  const subsMap: Record<string, any> = {};
  subsSnap.docs.forEach(d => { subsMap[d.id] = { id: d.id, ...d.data() }; });

  const result = orgsSnap.docs.map(d => {
    const org = { id: d.id, name: d.data().name, plan: d.data().plan };
    const sub = subsMap[d.id] || null;
    return {
      org,
      subscription: sub ? {
        ...sub,
        startDate: normalizeDate(sub.startDate),
        endDate: normalizeDate(sub.endDate),
        renewalDate: normalizeDate(sub.renewalDate),
      } : null,
    };
  });

  return NextResponse.json({ subscriptions: result });
}
