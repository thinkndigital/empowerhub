import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data() || {};
    // Return all users in the same org
    const orgId = userData.orgId;
    let snap;
    if (orgId) {
      snap = await adminDb.collection('users').where('orgId', '==', orgId).get();
    } else {
      snap = await adminDb.collection('users').limit(50).get();
    }
    const contacts = snap.docs
      .filter(d => d.id !== decoded.uid)
      .map(d => ({ id: d.id, name: d.data().name || 'مستخدم', role: d.data().role || '', email: d.data().email || '' }));
    return NextResponse.json({ contacts });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
