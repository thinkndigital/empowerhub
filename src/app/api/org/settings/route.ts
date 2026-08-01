import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function resolveOrgId(token: string): Promise<string | null> {
  const decoded = await adminAuth.verifyIdToken(token);
  let orgId = (decoded as any).organizationId as string | undefined;
  if (!orgId) {
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    orgId = userDoc.data()?.organizationId;
  }
  return orgId || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const orgId = await resolveOrgId(token);
    if (!orgId) return NextResponse.json({ error: 'ليس مدير منظمة' }, { status: 403 });
    const snap = await adminDb.collection('organizations').doc(orgId).get();
    return NextResponse.json({ org: snap.exists ? { id: snap.id, ...snap.data() } : null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const orgId = await resolveOrgId(token);
    if (!orgId) return NextResponse.json({ error: 'ليس مدير منظمة' }, { status: 403 });

    const body = await req.json();

    // Organizations may only edit their own operational settings — brand
    // color (primaryColor) is admin-only and managed from the admin panel.
    const allowedFields = ['name', 'logoUrl', 'courseSessionPrice', 'mentorshipSessionPrice'];

    // Remove any undefined / null values that Firestore rejects, and drop
    // any field outside the allowlist.
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
      if (allowedFields.includes(k) && v !== undefined && v !== null) clean[k] = v;
    }

    // set+merge safely creates the document if it does not exist yet
    await adminDb.collection('organizations').doc(orgId).set(clean, { merge: true });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: `فشل حفظ إعدادات الجهة: ${e.message}` },
      { status: 500 },
    );
  }
}
