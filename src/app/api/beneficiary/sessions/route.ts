import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

function normalizeDate(date: any): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  if (typeof date === 'object' && (date._seconds || date.seconds)) {
    return new Date((date._seconds ?? date.seconds) * 1000).toISOString();
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Query sessions where this beneficiary is in attendees array OR is the direct beneficiaryId
    const [attendeesSnap, beneficiarySnap] = await Promise.all([
      adminDb.collection('sessions').where('attendees', 'array-contains', uid).get(),
      adminDb.collection('sessions').where('beneficiaryId', '==', uid).get(),
    ]);

    // Merge and deduplicate
    const seen = new Set<string>();
    const sessions: any[] = [];
    for (const d of [...attendeesSnap.docs, ...beneficiarySnap.docs]) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const data = d.data();
      sessions.push({ id: d.id, ...data, date: normalizeDate(data.date) });
    }

    sessions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return NextResponse.json({ sessions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
