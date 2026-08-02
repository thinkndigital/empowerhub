import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { checkOrgLimit } from '@/lib/plan-limits';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const scope = req.nextUrl.searchParams.get('scope');
    const approved = req.nextUrl.searchParams.get('approved');

    let query: FirebaseFirestore.Query = adminDb.collection('products');

    if (scope === 'all') {
      // Org sees all products for their org
      const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
      const orgId = userSnap.data()?.organizationId || (decoded as any).organizationId;
      if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });
      query = query.where('orgId', '==', orgId);
    } else {
      // Beneficiary sees own products
      query = query.where('userId', '==', decoded.uid);
    }

    if (approved === 'true') {
      query = query.where('status', '==', 'approved');
    }

    const snap = await query.get();
    const rawProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rawProducts.sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return NextResponse.json({ products: rawProducts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    const { name, description, price, category, image } = body;

    if (!name || !description || price == null || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user info
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnap.data() || {};
    const orgId = userData.organizationId || (decoded as any).organizationId || '';

    if (orgId) {
      const limitCheck = await checkOrgLimit(orgId, 'maxProducts');
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.message }, { status: 403 });
      }
    }

    const product = {
      name,
      description,
      price: Number(price),
      category,
      ...(image ? { image } : {}),
      userId: decoded.uid,
      userName: userData.name || (decoded as any).name || '',
      orgId,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    const ref = await adminDb.collection('products').add(product);
    return NextResponse.json({ id: ref.id, ...product });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);

    // Check caller is org role
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userSnap.data()?.role;
    if (role !== 'organization') {
      return NextResponse.json({ error: 'Forbidden: only organizations can approve/reject products' }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await adminDb.collection('products').doc(id).update({ status });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await adminAuth.verifyIdToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const docSnap = await adminDb.collection('products').doc(id).get();
    if (!docSnap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = docSnap.data()!;
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userSnap.data()?.role;

    if (data.userId !== decoded.uid && role !== 'organization') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('products').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
