import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken);

    // 1. Check custom claims first
    let role = decoded.role as string | undefined;
    let organizationId = decoded.organizationId as string | undefined;

    // 2. Fall back to Firestore if no claim
    if (!role) {
      try {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        if (userDoc.exists) {
          role = userDoc.data()?.role;
          organizationId = userDoc.data()?.organizationId;
        }
      } catch {}
    }

    // 3. Set custom claim for future logins if we found a role
    if (role && !decoded.role) {
      try {
        const claims: Record<string, any> = { role };
        if (organizationId) claims.organizationId = organizationId;
        await adminAuth.setCustomUserClaims(decoded.uid, claims);
      } catch {}
    }

    // 4. Ensure Firestore user doc exists (create if missing)
    try {
      const userDocRef = adminDb.collection('users').doc(decoded.uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        const authUser = await adminAuth.getUser(decoded.uid);
        await userDocRef.set({
          id: decoded.uid,
          name: authUser.displayName || authUser.email?.split('@')[0] || '',
          email: authUser.email || '',
          role: role || 'beneficiary',
          status: 'نشط',
          progress: 0,
          createdAt: new Date().toISOString(),
          ...(organizationId ? { organizationId } : {}),
        });
      } else if (!userDoc.data()?.organizationId && organizationId) {
        // Doc exists but missing organizationId — patch it
        await userDocRef.update({ organizationId });
      }
    } catch {}

    return NextResponse.json({ role: role || 'beneficiary', organizationId });
  } catch (e: any) {
    return NextResponse.json({ role: 'beneficiary' });
  }
}
