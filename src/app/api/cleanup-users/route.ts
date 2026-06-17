import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// One-time cleanup: remove orphaned Firestore docs and fix duplicates
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded.role !== 'organization' && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all Firebase Auth users
    const authListResult = await adminAuth.listUsers(100);
    const validUids = new Set(authListResult.users.map(u => u.uid));

    // Get all Firestore user docs
    const usersSnap = await adminDb.collection('users').get();
    const deleted: string[] = [];
    const kept: string[] = [];

    for (const docSnap of usersSnap.docs) {
      if (!validUids.has(docSnap.id)) {
        // Orphaned doc — delete it
        await docSnap.ref.delete();
        deleted.push(docSnap.id);
      } else {
        kept.push(docSnap.id);
      }
    }

    // Ensure every auth user has a Firestore doc with correct role/organizationId
    const created: string[] = [];
    for (const authUser of authListResult.users) {
      const claims = authUser.customClaims || {};
      if (!claims.role) continue; // skip users without role claims

      const docRef = adminDb.collection('users').doc(authUser.uid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        await docRef.set({
          id: authUser.uid,
          name: authUser.displayName || authUser.email?.split('@')[0] || '',
          email: authUser.email || '',
          role: claims.role,
          status: 'نشط',
          progress: 0,
          createdAt: new Date().toISOString(),
          ...(claims.organizationId ? { organizationId: claims.organizationId } : {}),
        });
        created.push(authUser.email || authUser.uid);
      } else {
        // Patch missing fields
        const data = docSnap.data()!;
        const updates: Record<string, any> = {};
        if (!data.organizationId && claims.organizationId) updates.organizationId = claims.organizationId;
        if (!data.role && claims.role) updates.role = claims.role;
        if (Object.keys(updates).length > 0) await docRef.update(updates);
      }
    }

    return NextResponse.json({ deleted: deleted.length, kept: kept.length, created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
