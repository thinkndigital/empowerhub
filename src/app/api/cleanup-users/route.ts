import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No token' }, { status: 401 });

    await adminAuth.verifyIdToken(idToken);

    // Get all Firebase Auth users
    const authListResult = await adminAuth.listUsers(100);
    const validUids = new Set(authListResult.users.map(u => u.uid));

    // Get all Firestore user docs
    const usersSnap = await adminDb.collection('users').get();
    let deleted = 0;
    const seenUids = new Set<string>();

    for (const docSnap of usersSnap.docs) {
      // Delete if no matching auth user (orphaned)
      if (!validUids.has(docSnap.id)) {
        await docSnap.ref.delete();
        deleted++;
        continue;
      }
      // Delete duplicates (same UID appearing twice)
      if (seenUids.has(docSnap.id)) {
        await docSnap.ref.delete();
        deleted++;
        continue;
      }
      seenUids.add(docSnap.id);
    }

    // Fix each auth user: ensure Firestore doc + custom claims are correct
    const fixed: string[] = [];
    const created: string[] = [];

    for (const authUser of authListResult.users) {
      const claims = authUser.customClaims || {};
      const docRef = adminDb.collection('users').doc(authUser.uid);
      const docSnap = await docRef.get();

      // Determine role: from claims first, then Firestore doc
      let role = claims.role as string | undefined;
      let organizationId = claims.organizationId as string | undefined;

      if (!role && docSnap.exists) {
        role = docSnap.data()?.role;
        organizationId = docSnap.data()?.organizationId;
      }

      if (!role) continue; // skip users with no role anywhere

      // Fix custom claims if missing or wrong
      if (!claims.role || claims.role !== role) {
        const newClaims: Record<string, any> = { role };
        if (organizationId) newClaims.organizationId = organizationId;
        await adminAuth.setCustomUserClaims(authUser.uid, newClaims);
        fixed.push(authUser.email || authUser.uid);
      }

      // Create or fix Firestore doc
      if (!docSnap.exists) {
        await docRef.set({
          id: authUser.uid,
          name: authUser.displayName || authUser.email?.split('@')[0] || '',
          email: authUser.email || '',
          role,
          status: 'نشط',
          progress: 0,
          createdAt: new Date().toISOString(),
          ...(organizationId ? { organizationId } : {}),
        });
        created.push(authUser.email || authUser.uid);
      } else {
        const data = docSnap.data()!;
        const updates: Record<string, any> = {};
        if (!data.organizationId && organizationId) updates.organizationId = organizationId;
        if (!data.role) updates.role = role;
        if (Object.keys(updates).length > 0) {
          await docRef.update(updates);
          fixed.push(authUser.email || authUser.uid);
        }
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      created: created.length,
      fixed: fixed.length,
      details: { created, fixed },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
