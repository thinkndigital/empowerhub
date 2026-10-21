import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { users, coachContracts, mentoringSessions } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { verifyAuthToken, DecodedToken } from '@/lib/auth-server';

async function getOrgId(decoded: DecodedToken): Promise<string | null> {
  let orgId = decoded.organizationId;
  if (!orgId) {
    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    orgId = userRow?.organizationId;
  }
  return orgId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const coachRows = await db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'coach')));
    const coachIds = coachRows.map(c => c.id);
    if (coachIds.length === 0) return NextResponse.json({ coaches: [] });

    const contractRows = await db.select().from(coachContracts).where(eq(coachContracts.organizationId, orgId));
    const contractMap: Record<string, { hourlyRate: number; currency: string; contractedHours?: number | null }> = {};
    for (const c of contractRows) {
      contractMap[c.coachId] = {
        hourlyRate: Number(c.hourlyRate || 0),
        currency: c.currency || 'JOD',
        contractedHours: c.contractedHours,
      };
    }

    const sessionRows = await db.select().from(mentoringSessions).where(and(
      inArray(mentoringSessions.hostId, coachIds),
      eq(mentoringSessions.organizationId, orgId),
      eq(mentoringSessions.status, 'completed'),
    ));

    const hoursMap: Record<string, number> = {};
    for (const s of sessionRows) {
      // `duration` is stored as free text (e.g. "60 دقيقة") elsewhere in the
      // app; sessions created via org/coaches billing historically only ever
      // summed a numeric minutes value, so coerce defensively.
      const minutes = Number((s as any).duration) || 0;
      hoursMap[s.hostId || ''] = (hoursMap[s.hostId || ''] || 0) + minutes;
    }

    const coaches = coachRows.map(c => {
      const contract = contractMap[c.id] || { hourlyRate: 0, currency: 'JOD' };
      const totalHours = Math.round(((hoursMap[c.id] || 0) / 60) * 10) / 10;
      return {
        id: c.id,
        name: c.name || c.displayName || '',
        email: c.email || '',
        avatarUrl: c.avatarUrl || '',
        hourlyRate: contract.hourlyRate,
        currency: contract.currency,
        contractedHours: contract.contractedHours,
        totalHours,
        totalCost: Math.round(totalHours * contract.hourlyRate * 100) / 100,
      };
    });

    return NextResponse.json({ coaches });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const { coachId, hourlyRate, currency, contractedHours } = await req.json();
    if (!coachId || hourlyRate == null) {
      return NextResponse.json({ error: 'coachId and hourlyRate required' }, { status: 400 });
    }

    await db.insert(coachContracts).values({
      id: randomUUID(),
      coachId,
      organizationId: orgId,
      hourlyRate: String(Number(hourlyRate)),
      currency: currency || 'JOD',
      contractedHours: contractedHours != null ? Number(contractedHours) : null,
    }).onDuplicateKeyUpdate({
      set: {
        hourlyRate: String(Number(hourlyRate)),
        currency: currency || 'JOD',
        contractedHours: contractedHours != null ? Number(contractedHours) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
