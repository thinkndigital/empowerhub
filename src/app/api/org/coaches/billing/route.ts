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

    // Get all coaches in this org
    const coachSnap = await adminDb
      .collection('users')
      .where('organizationId', '==', orgId)
      .where('role', '==', 'coach')
      .get();

    const coachIds = coachSnap.docs.map(d => d.id);
    if (coachIds.length === 0) return NextResponse.json({ coaches: [] });

    // Get contracts for all coaches in this org
    const contractSnap = await adminDb
      .collection('coachContracts')
      .where('orgId', '==', orgId)
      .get();

    const contractMap: Record<string, { hourlyRate: number; currency: string; contractedHours?: number }> = {};
    contractSnap.docs.forEach(d => {
      const data = d.data();
      contractMap[data.coachId] = {
        hourlyRate: data.hourlyRate || 0,
        currency: data.currency || 'JOD',
        contractedHours: data.contractedHours,
      };
    });

    // Get completed sessions for each coach in this org
    const sessionSnaps = await Promise.all(
      coachIds.map(id =>
        adminDb
          .collection('sessions')
          .where('hostId', '==', id)
          .where('organizationId', '==', orgId)
          .where('status', '==', 'completed')
          .get()
      )
    );

    const hoursMap: Record<string, number> = {};
    coachIds.forEach((id, i) => {
      let totalMinutes = 0;
      sessionSnaps[i].docs.forEach(d => {
        totalMinutes += d.data().duration || 0;
      });
      hoursMap[id] = Math.round((totalMinutes / 60) * 10) / 10;
    });

    const coaches = coachSnap.docs.map(d => {
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

    return NextResponse.json({ coaches });
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

    const { coachId, hourlyRate, currency, contractedHours } = await req.json();
    if (!coachId || hourlyRate == null) {
      return NextResponse.json({ error: 'coachId and hourlyRate required' }, { status: 400 });
    }

    // Upsert contract
    const existing = await adminDb
      .collection('coachContracts')
      .where('coachId', '==', coachId)
      .where('orgId', '==', orgId)
      .limit(1)
      .get();

    const contractData = {
      coachId,
      orgId,
      hourlyRate: Number(hourlyRate),
      currency: currency || 'JOD',
      contractedHours: contractedHours != null ? Number(contractedHours) : null,
      updatedAt: new Date().toISOString(),
    };

    if (!existing.empty) {
      await existing.docs[0].ref.update(contractData);
    } else {
      await adminDb.collection('coachContracts').add({
        ...contractData,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
