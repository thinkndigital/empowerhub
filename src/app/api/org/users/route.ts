import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const orgId = decoded.organizationId as string | undefined;
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });

    const role = req.nextUrl.searchParams.get('role') || 'beneficiary';
    const scope = req.nextUrl.searchParams.get('scope') || 'all'; // 'org' | 'all'
    const mentorId = req.nextUrl.searchParams.get('mentorId');
    const coachId = req.nextUrl.searchParams.get('coachId');

    let snap;
    if (mentorId) {
      snap = await adminDb.collection('users').where('role', '==', 'beneficiary').where('mentorId', '==', mentorId).get();
    } else if (coachId) {
      snap = await adminDb.collection('users').where('role', '==', 'beneficiary').where('coachId', '==', coachId).get();
    } else if (scope === 'org') {
      snap = await adminDb.collection('users')
        .where('role', '==', role)
        .where('organizationId', '==', orgId)
        .get();
    } else {
      snap = await adminDb.collection('users')
        .where('role', '==', role)
        .get();
    }

    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
