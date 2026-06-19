import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

export async function GET(req: NextRequest, { params }: { params: { orgId: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('subscriptions').doc(params.orgId).get();
  return NextResponse.json({ subscription: snap.exists ? { id: snap.id, ...snap.data() } : null });
}

export async function PATCH(req: NextRequest, { params }: { params: { orgId: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  // Update subscription doc
  await adminDb.collection('subscriptions').doc(params.orgId).set({
    ...body,
    updatedAt: new Date(),
  }, { merge: true });

  // Also update plan on the org doc
  if (body.planId) {
    const planSnap = await adminDb.collection('plans').doc(body.planId).get();
    if (planSnap.exists) {
      const planKey = (planSnap.data() as any).key || body.planId;
      await adminDb.collection('organizations').doc(params.orgId).update({ plan: planKey });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { orgId: string } }) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await adminDb.collection('subscriptions').doc(params.orgId).delete();
  return NextResponse.json({ ok: true });
}
