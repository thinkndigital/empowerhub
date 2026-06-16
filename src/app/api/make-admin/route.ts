import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// One-time endpoint to promote a user to admin by email
// Usage: POST /api/make-admin with { email, secret }
export async function POST(req: NextRequest) {
  const { email, secret } = await req.json();

  // Simple secret to prevent unauthorized use
  if (secret !== 'empowerhub-setup-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  // Find user by email in Firestore
  const snapshot = await adminDb.collection('users').where('email', '==', email).get();

  if (snapshot.empty) {
    return NextResponse.json({ error: 'User not found in Firestore. Login first to create profile.' }, { status: 404 });
  }

  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({ role: 'admin' });

  return NextResponse.json({ success: true, message: `${email} is now an admin.` });
}
