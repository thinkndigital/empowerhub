import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function getOrgId(decoded: any): Promise<string | null> {
  let orgId = decoded.organizationId as string | undefined;
  if (!orgId) {
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    orgId = userDoc.data()?.organizationId;
  }
  return orgId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    // Get all mentors in this org
    const mentorSnap = await adminDb
      .collection('users')
      .where('organizationId', '==', orgId)
      .where('role', '==', 'mentor')
      .get();

    const mentorIds = mentorSnap.docs.map(d => d.id);
    if (mentorIds.length === 0) return NextResponse.json({ mentors: [] });

    // Get contracts for all mentors in this org
    const contractSnap = await adminDb
      .collection('mentorContracts')
      .where('orgId', '==', orgId)
      .get();

    const contractMap: Record<string, { hourlyRate: number; currency: string; contractedHours?: number }> = {};
    contractSnap.docs.forEach(d => {
      const data = d.data();
      contractMap[data.mentorId] = {
        hourlyRate: data.hourlyRate || 0,
        currency: data.currency || 'JOD',
        contractedHours: data.contractedHours,
      };
    });

    // Get completed sessions for each mentor in this org
    const sessionSnaps = await Promise.all(
      mentorIds.map(id =>
        adminDb
          .collection('sessions')
          .where('hostId', '==', id)
          .where('organizationId', '==', orgId)
          .where('status', '==', 'completed')
          .get()
      )
    );

    const hoursMap: Record<string, number> = {};
    mentorIds.forEach((id, i) => {
      let totalMinutes = 0;
      sessionSnaps[i].docs.forEach(d => {
        totalMinutes += d.data().duration || 0;
      });
      hoursMap[id] = Math.round((totalMinutes / 60) * 10) / 10;
    });

    const mentors = mentorSnap.docs.map(d => {
      const data = d.data();
      const contract = contractMap[d.id] || { hourlyRate: 0, currency: 'JOD' };
      const totalHours = hoursMap[d.id] || 0;
      return {
        id: d.id,
        name: data.name || data.displayName || '',
        email: data.email || '',
        avatarUrl: data.avatarUrl || data.photoURL || '',
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
    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = await getOrgId(decoded);
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const { mentorId, hourlyRate, currency, contractedHours } = await req.json();
    if (!mentorId || hourlyRate == null) {
      return NextResponse.json({ error: 'mentorId and hourlyRate required' }, { status: 400 });
    }

    // Upsert contract
    const existing = await adminDb
      .collection('mentorContracts')
      .where('mentorId', '==', mentorId)
      .where('orgId', '==', orgId)
      .limit(1)
      .get();

    const contractData = {
      mentorId,
      orgId,
      hourlyRate: Number(hourlyRate),
      currency: currency || 'JOD',
      contractedHours: contractedHours != null ? Number(contractedHours) : null,
      updatedAt: new Date().toISOString(),
    };

    if (!existing.empty) {
      await existing.docs[0].ref.update(contractData);
    } else {
      await adminDb.collection('mentorContracts').add({
        ...contractData,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
