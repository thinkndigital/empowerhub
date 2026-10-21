import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { products, users } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const scope = req.nextUrl.searchParams.get('scope');
    const approved = req.nextUrl.searchParams.get('approved');

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);

    const conditions = [];
    if (scope === 'all') {
      const orgId = userRow?.organizationId || decoded.organizationId;
      if (!orgId) return NextResponse.json({ error: 'Not an org' }, { status: 403 });
      conditions.push(eq(products.organizationId, orgId));
    } else {
      conditions.push(eq(products.userId, decoded.uid));
    }
    if (approved === 'true') {
      conditions.push(eq(products.status, 'approved'));
    }

    const rows = await db.select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt));
    return NextResponse.json({ products: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const body = await req.json();
    const { name, description, price, category, image } = body;

    if (!name || !description || price == null || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    const orgId = userRow?.organizationId || decoded.organizationId || null;

    const id = randomUUID();
    const product = {
      id,
      name,
      description,
      price: String(Number(price)),
      category,
      image: image || null,
      userId: decoded.uid,
      beneficiaryName: userRow?.name || '',
      organizationId: orgId,
      status: 'pending' as const,
    };

    await db.insert(products).values(product);
    return NextResponse.json(product);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    if (userRow?.role !== 'organization') {
      return NextResponse.json({ error: 'Forbidden: only organizations can approve/reject products' }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await db.update(products).set({ status }).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const decoded = await verifyAuthToken(token);
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [userRow] = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);

    if (product.userId !== decoded.uid && userRow?.role !== 'organization') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
