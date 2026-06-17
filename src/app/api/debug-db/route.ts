import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken);

    // Get all users from Firestore
    const usersSnap = await adminDb.collection('users').limit(30).get();
    const firestoreUsers = usersSnap.docs.map(d => ({
      id: d.id,
      role: d.data().role,
      name: d.data().name,
      email: d.data().email,
      organizationId: d.data().organizationId || null,
    }));

    // Get all Firebase Auth users
    const authListResult = await adminAuth.listUsers(30);
    const authUsers = authListResult.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      claims: u.customClaims || {},
      hasFirestoreDoc: firestoreUsers.some(f => f.id === u.uid),
    }));

    // Current user token claims
    const authUser = await adminAuth.getUser(decoded.uid);

    return NextResponse.json({
      currentUser: {
        uid: decoded.uid,
        email: decoded.email,
        customClaims: authUser.customClaims || {},
      },
      authUsers,
      firestoreUsers,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
