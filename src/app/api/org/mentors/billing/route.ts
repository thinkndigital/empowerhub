import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { users, mentorContracts, mentoringSessions } from '@/lib/schema';
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

    const mentorRows = await db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'mentor')));
    const mentorIds = mentorRows.map(m => m.id);
    if (mentorIds.length === 0) return NextResponse.json({ mentors: [] });

    const contractRows = await db.select().from(mentorContracts).where(eq(mentorContracts.organizationId, orgId));
    const contractMap: Record<string, { hourlyRate: number; currency: string; contractedHours?: number | null }> = {};
    for (const c of contractRows) {
      contractMap[c.mentorId] = {
        hourlyRate: Number(c.hourlyRate || 0),
        currency: c.currency || 'JOD',
        contractedHours: c.contractedHours,
      };
    }

    const sessionRows = await db.select().from(mentoringSessions).where(and(
      inArray(mentoringSessions.hostId, mentorIds),
      eq(mentoringSessions.organizationId, orgId),
      eq(mentoringSessions.status, 'completed'),
    ));

    const hoursMap: Record<string, number> = {};
    for (const s of sessionRows) {
      const minutes = Number((s as any).duration) || 0;
      hoursMap[s.hostId || ''] = (hoursMap[s.hostId || ''] || 0) + minutes;
    }

    const mentors = mentorRows.map(m => {
      const contract = contractMap[m.id] || { hourlyRate: 0, currency: 'JOD' };
      const totalHours = Math.round(((hoursMap[m.id] || 0) / 60) * 10) / 10;
      return {
        id: m.id,
        name: m.name || m.displayName || '',
        email: m.email || '',
        avatarUrl: m.avatarUrl || '',
        hourlyRate: contract.hourlyRate,
        currency: contract.currency,
        contractedHours: contract.contractedHours,
        totalHours,
        totalCost: Math.round(totalHours * contract.hourlyRate * 100) / 100,
      };
    });

    return NextResponse.json({ mentors });
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

    const { mentorId, hourlyRate, currency, contractedHours } = await req.json();
    if (!mentorId || hourlyRate == null) {
      return NextResponse.json({ error: 'mentorId and hourlyRate required' }, { status: 400 });
    }

    await db.insert(mentorContracts).values({
      id: randomUUID(),
      mentorId,
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
