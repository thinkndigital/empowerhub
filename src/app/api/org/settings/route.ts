import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    if (!orgId) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      orgId = userDoc.data()?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });
    const snap = await adminDb.collection('organizations').doc(orgId).get();
    return NextResponse.json({ org: snap.exists ? { id: snap.id, ...snap.data() } : null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    let orgId = decoded.organizationId as string | undefined;
    if (!orgId) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      orgId = userDoc.data()?.organizationId;
    }
    if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });
    const body = await req.json();
    // set+merge creates the document if it doesn't exist yet
    await adminDb.collection('organizations').doc(orgId).set(body, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
