import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function checkAuth() {
  return cookies().get('ap_session')?.value === 'empowerhub-admin-2026-secret';
}

// Kept in its own config/email doc (separate from config/platform) since
// other admin routes expose config/platform more broadly — isolating the
// Resend key here limits its blast radius.
export async function GET() {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snap = await adminDb.collection('config').doc('email').get();
  const data = snap.exists ? (snap.data() as any) : {};
  return NextResponse.json({
    config: {
      hasResendApiKey: !!data.resendApiKey,
      fromName: data.fromName || 'EmpowerHub',
      fromAddress: data.fromAddress || '',
    },
  });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const updates: Record<string, any> = {};
  // Only overwrite the key if a new non-empty value was submitted — the GET
  // response never echoes the real key back, so the field starts empty in
  // the UI and shouldn't clear a previously-saved key on an untouched save.
  if (typeof body.resendApiKey === 'string' && body.resendApiKey.trim()) {
    updates.resendApiKey = body.resendApiKey.trim();
  }
  if (typeof body.fromName === 'string') updates.fromName = body.fromName.trim();
  if (typeof body.fromAddress === 'string') updates.fromAddress = body.fromAddress.trim();

  await adminDb.collection('config').doc('email').set(updates, { merge: true });
  return NextResponse.json({ ok: true });
}
