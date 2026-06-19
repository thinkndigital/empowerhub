import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    // Get organizationId from Firestore doc (more reliable than token claims)
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const orgId = userDoc.data()?.organizationId || (decoded.organizationId as string | undefined);

    let courses: any[] = [];

    if (orgId) {
      const snap = await adminDb.collection('courses').where('organizationId', '==', orgId).get();
      courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      // fallback: courses assigned directly to beneficiary
      const snap = await adminDb.collection('courses').where('assignedTo', 'array-contains', decoded.uid).get();
      courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    return NextResponse.json({ courses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
